import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./supabaseAuth";
import { aiService } from "./aiService";
import { matchingService } from "./matchingService";
import { PipelineService } from "./pipelineService";
import { InterviewService } from "./interviewService";
import { NotificationService } from "./notificationService";
import { z } from "zod";
import { insertJobSeekerSchema, insertEmployerSchema, insertJobSchema, insertApplicationSchema, insertMatchSchema, insertLearningPlanSchema, insertTeamInvitationSchema, insertPasswordResetTokenSchema, insertCandidateTagSchema, insertCandidateNoteSchema, insertCandidateRatingSchema, insertGithubRepoSchema, insertResumeParseQueueSchema, insertSkillEvidenceSchema, insertSkillEndorsementSchema, insertSkillTestSchema, insertAchievementSchema, insertMatchFeedbackSchema, insertMatchingWeightSchema, insertInterviewSchema, insertNotificationSchema, insertIntegrationConfigSchema } from "@shared/schema";
import Stripe from "stripe";
import { randomBytes, createHash } from "crypto";
import { authEnhancements, require2FA } from "./authEnhancements";
import bcrypt from "bcryptjs";
import { setupOAuth } from "./oauth";
import { csrfProtection, generateCsrfTokenRoute } from "./csrfProtection";
import { createAuditLogger } from "./auditLog";
import { createGDPRService } from "./gdprService";
import { emailService } from "./emailService";
import { permissionService, requirePermission, requireAnyPermission, loadPermissionContext } from "./permissionService";
import * as schema from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  setupOAuth(app);

  // Initialize security and audit services
  app.use(csrfProtection);
  const auditLogger = createAuditLogger(storage);
  const gdprService = createGDPRService(storage, auditLogger);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const jobSeeker = await storage.getJobSeeker(userId);
      const employer = await storage.getEmployer(userId);

      res.json({
        ...user,
        jobSeeker,
        employer,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/profile/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ role: user?.role || 'job_seeker' });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post('/api/profile/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['job_seeker', 'employer', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.upsertUser({
        ...user,
        role,
      });

      if (role === 'job_seeker') {
        const existing = await storage.getJobSeeker(userId);
        if (!existing) {
          await storage.createJobSeeker({ userId });
        }
      } else if (role === 'employer') {
        const existing = await storage.getEmployer(userId);
        if (!existing) {
          await storage.createEmployer({
            userId,
            companyName: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}'s Company`
              : 'My Company',
          });
        }
      }

      res.json({ role });
    } catch (error) {
      console.error("Error setting role:", error);
      res.status(500).json({ message: "Failed to set role" });
    }
  });

  app.post('/api/auth/forgot-password', async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.json({ message: "If email exists, reset link sent" });
      }

      await storage.deletePasswordResetTokensByUserId(user.id);

      const { token, hashedToken } = authEnhancements.generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 3600000);

      await storage.createPasswordResetToken({
        userId: user.id,
        email: user.email!,
        token: hashedToken,
        expiresAt,
      });

      await authEnhancements.sendPasswordResetEmail(email, token, user.id);
      
      res.json({ message: "If email exists, reset link sent" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post('/api/auth/reset-password', async (req: any, res) => {
    try {
      const { token, userId, newPassword } = req.body;
      
      if (!token || !userId || !newPassword) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const hashedToken = createHash("sha256").update(token).digest("hex");
      
      const resetToken = await storage.getPasswordResetToken(userId, hashedToken);
      
      if (!resetToken || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await storage.updateUserPassword(userId, hashedPassword);
      await storage.deletePasswordResetToken(resetToken.id);
      
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post('/api/auth/2fa/setup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!['employer', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "2FA only available for employers and admins" });
      }

      if (user.twoFactorEnabled && !req.session?.twoFactorVerified) {
        return res.status(403).json({ 
          message: "2FA verification required to change settings",
          requires2FA: true 
        });
      }

      const { secret, otpauthUrl } = authEnhancements.generate2FASecret(user.email!);
      const qrCode = await authEnhancements.generate2FAQRCode(otpauthUrl);

      await storage.upsertUser({
        ...user,
        twoFactorSecret: secret,
        twoFactorEnabled: false,
      });

      res.json({
        secret,
        qrCode,
        backupCodes: authEnhancements.generateBackupCodes(),
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  app.post('/api/auth/2fa/verify-setup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ message: "2FA not setup" });
      }

      const verified = authEnhancements.verify2FAToken(user.twoFactorSecret, token, 2);
      
      if (verified) {
        await storage.upsertUser({
          ...user,
          twoFactorEnabled: true,
        });
        
        res.json({ success: true, message: "2FA enabled successfully" });
      } else {
        res.status(401).json({ success: false, message: "Invalid token" });
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });

  app.post('/api/auth/2fa/validate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ message: "2FA not enabled" });
      }

      const isValid = authEnhancements.verify2FAToken(user.twoFactorSecret, token, 1);
      
      if (isValid && req.session) {
        req.session.twoFactorVerified = true;
      }
      
      res.json({ authenticated: isValid });
    } catch (error) {
      console.error("2FA validation error:", error);
      res.status(500).json({ message: "Failed to validate 2FA" });
    }
  });

  app.get('/api/auth/2fa/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        enabled: user.twoFactorEnabled || false,
        verified: req.session?.twoFactorVerified || false,
        required: user.twoFactorEnabled && !req.session?.twoFactorVerified,
      });
    } catch (error) {
      console.error("2FA status error:", error);
      res.status(500).json({ message: "Failed to get 2FA status" });
    }
  });

  app.post('/api/auth/2fa/disable', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.upsertUser({
        ...user,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });
      
      res.json({ message: "2FA disabled successfully" });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  app.get('/api/job-seeker/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      res.json(jobSeeker);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/job-seeker/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertJobSeekerSchema.partial().parse(req.body);
      const existing = await storage.getJobSeeker(userId);
      
      if (existing) {
        const updated = await storage.updateJobSeeker(existing.id, validatedData);
        res.json(updated);
      } else {
        const created = await storage.createJobSeeker({ ...validatedData, userId });
        res.json(created);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid profile data", errors: error });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/job-seeker/extract-skills', isAuthenticated, async (req: any, res) => {
    try {
      const { resumeText } = req.body;
      if (!resumeText || typeof resumeText !== 'string') {
        return res.status(400).json({ message: "Resume text is required" });
      }
      const skills = await aiService.extractResumeSkills(resumeText);
      res.json({ skills });
    } catch (error) {
      res.status(500).json({ message: "Failed to extract skills" });
    }
  });

  app.get('/api/employer/profile', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      res.json(employer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/employer/profile', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmployerSchema.partial().parse(req.body);
      const existing = await storage.getEmployer(userId);
      
      if (existing) {
        const updated = await storage.updateEmployer(existing.id, validatedData);
        res.json(updated);
      } else {
        const created = await storage.createEmployer({ 
          ...validatedData, 
          userId,
          companyName: validatedData.companyName || 'My Company',
        });
        res.json(created);
      }
    } catch (error) {
      console.error("Error updating employer profile:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid profile data", errors: error });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/jobs', async (req: any, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get('/api/jobs/:id', async (req: any, res) => {
    try {
      const job = await storage.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.get('/api/employer/jobs', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const jobs = await storage.getJobs(employer.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post('/api/employer/jobs', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const validatedData = insertJobSchema.parse({
        ...req.body,
        employerId: employer.id,
      });
      
      const job = await storage.createJob(validatedData);
      res.json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid job data", errors: error });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch('/api/employer/jobs/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const validatedData = insertJobSchema.partial().parse(req.body);
      const updated = await storage.updateJob(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid job data", errors: error });
      }
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.post('/api/employer/jobs/:id/parse', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const job = await storage.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.employerId !== employer.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const parsedData = await aiService.parseJobDescription(job.title, job.description);
      
      const updated = await storage.updateJob(job.id, {
        aiProcessed: true,
        aiParsedData: parsedData,
        requiredSkills: parsedData.extractedSkills,
        experienceLevel: parsedData.extractedSeniority,
        salaryMin: parsedData.suggestedSalaryMin,
        salaryMax: parsedData.suggestedSalaryMax,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error parsing job:", error);
      res.status(500).json({ message: "Failed to parse job description" });
    }
  });

  app.post('/api/employer/jobs/:id/duplicate', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const originalJob = await storage.getJobById(req.params.id);
      if (!originalJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (originalJob.employerId !== employer.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const newJob = await storage.createJob({
        employerId: originalJob.employerId,
        title: `${originalJob.title} (Copy)`,
        description: originalJob.description,
        location: originalJob.location,
        remote: originalJob.remote,
        salaryMin: originalJob.salaryMin,
        salaryMax: originalJob.salaryMax,
        salaryCurrency: originalJob.salaryCurrency,
        requiredSkills: originalJob.requiredSkills,
        preferredSkills: originalJob.preferredSkills,
        experienceLevel: originalJob.experienceLevel,
        employmentType: originalJob.employmentType,
        status: "draft",
        aiProcessed: false,
      });

      res.json(newJob);
    } catch (error) {
      console.error("Error duplicating job:", error);
      res.status(500).json({ message: "Failed to duplicate job" });
    }
  });

  app.post('/api/employer/jobs/:id/publish', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const job = await storage.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.employerId !== employer.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateJob(req.params.id, {
        status: "active",
        publishedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to publish job" });
    }
  });

  app.post('/api/employer/jobs/:id/archive', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const job = await storage.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.employerId !== employer.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateJob(req.params.id, {
        status: "archived",
        archivedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to archive job" });
    }
  });

  app.post('/api/employer/jobs/:id/reopen', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const job = await storage.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.employerId !== employer.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateJob(req.params.id, {
        status: "active",
        archivedAt: null,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to reopen job" });
    }
  });

  app.get('/api/jobs/search', async (req: any, res) => {
    try {
      const { skills, location, minSalary, maxSalary, experienceLevel, remote } = req.query;
      const jobs = await storage.searchJobs({
        skills: skills ? skills.split(',') : undefined,
        location,
        minSalary: minSalary ? parseInt(minSalary) : undefined,
        maxSalary: maxSalary ? parseInt(maxSalary) : undefined,
        experienceLevel,
        remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
      });
      res.json(jobs);
    } catch (error) {
      console.error("Error searching jobs:", error);
      res.status(500).json({ message: "Failed to search jobs" });
    }
  });

  app.post('/api/jobs/:jobId/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const validatedData = insertApplicationSchema.parse({
        jobId: req.params.jobId,
        jobSeekerId: jobSeeker.id,
        coverLetter: req.body.coverLetter,
        timeline: [{
          stage: "Applied",
          status: "completed",
          date: new Date().toISOString(),
        }],
      });

      const application = await storage.createApplication(validatedData);
      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid application data", errors: error });
      }
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  app.get('/api/job-seeker/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const applications = await storage.getApplications(jobSeeker.id);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get('/api/employer/applications', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const jobs = await storage.getJobs(employer.id);
      const allApplications = await Promise.all(
        jobs.map(job => storage.getApplications(undefined, job.id))
      );
      
      res.json(allApplications.flat());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.patch('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertApplicationSchema.partial().parse(req.body);
      const updated = await storage.updateApplication(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid application data", errors: error });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  const pipelineService = new PipelineService(storage);

  app.post('/api/applications/:id/stage', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const employer = await storage.getEmployer(userId);
      
      if (!user || !employer) {
        return res.status(403).json({ message: "Forbidden - employer access required" });
      }

      const employerApplications = await storage.getApplicationsByEmployer(employer.id);
      const application = employerApplications.find(a => a.id === req.params.id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found or forbidden" });
      }

      const { stage, notes } = req.body;
      
      if (!['applied', 'interview', 'offer', 'hired', 'rejected'].includes(stage)) {
        return res.status(400).json({ message: "Invalid stage" });
      }

      const updated = await pipelineService.updateApplicationStage(
        application,
        stage,
        user,
        notes
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating application stage:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update application stage" });
    }
  });

  app.get('/api/applications/:id/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      const employer = await storage.getEmployer(userId);
      
      let application;
      
      if (jobSeeker) {
        const jobSeekerApplications = await storage.getApplications(jobSeeker.id);
        application = jobSeekerApplications.find(a => a.id === req.params.id);
      } else if (employer) {
        const employerApplications = await storage.getApplicationsByEmployer(employer.id);
        application = employerApplications.find(a => a.id === req.params.id);
      }
      
      if (!application) {
        return res.status(404).json({ message: "Application not found or forbidden" });
      }

      const timeline = await pipelineService.getApplicationTimeline(application);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching application timeline:", error);
      if (error instanceof Error) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to fetch application timeline" });
    }
  });

  app.post('/api/applications/bulk-update-stage', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const employer = await storage.getEmployer(userId);
      
      if (!user || !employer) {
        return res.status(403).json({ message: "Forbidden - employer access required" });
      }

      const { applicationIds, stage, notes } = req.body;
      
      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        return res.status(400).json({ message: "Invalid application IDs" });
      }
      
      if (!['applied', 'interview', 'offer', 'hired', 'rejected'].includes(stage)) {
        return res.status(400).json({ message: "Invalid stage" });
      }

      const employerApplications = await storage.getApplicationsByEmployer(employer.id);
      const employerAppIds = new Set(employerApplications.map(a => a.id));
      
      const validApplications = employerApplications.filter(app => applicationIds.includes(app.id));

      if (validApplications.length === 0) {
        return res.status(403).json({ message: "Forbidden - no valid applications to update" });
      }

      const updated = await pipelineService.bulkUpdateStage(
        validApplications,
        stage,
        user,
        notes
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Error bulk updating stages:", error);
      res.status(500).json({ message: "Failed to bulk update stages" });
    }
  });

  app.get('/api/employer/pipeline/metrics', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const metrics = await pipelineService.getStageMetrics(employer.id);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching pipeline metrics:", error);
      res.status(500).json({ message: "Failed to fetch pipeline metrics" });
    }
  });

  app.get('/api/employer/candidates/:jobSeekerId/tags', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const tags = await storage.getCandidateTags(req.params.jobSeekerId, employer.id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching candidate tags:", error);
      res.status(500).json({ message: "Failed to fetch candidate tags" });
    }
  });

  app.post('/api/employer/candidates/:jobSeekerId/tags', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const validatedData = insertCandidateTagSchema.parse({
        jobSeekerId: req.params.jobSeekerId,
        employerId: employer.id,
        tag: req.body.tag,
      });

      const tag = await storage.createCandidateTag(validatedData);
      res.json(tag);
    } catch (error) {
      console.error("Error creating candidate tag:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid tag data", errors: error });
      }
      res.status(500).json({ message: "Failed to create candidate tag" });
    }
  });

  app.delete('/api/employer/candidates/tags/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const tags = await storage.getCandidateTags(undefined, employer.id);
      const tag = tags.find(t => t.id === req.params.id);

      if (!tag) {
        return res.status(404).json({ message: "Tag not found or access denied" });
      }

      await storage.deleteCandidateTag(req.params.id);
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting candidate tag:", error);
      res.status(500).json({ message: "Failed to delete candidate tag" });
    }
  });

  app.get('/api/employer/candidates/:jobSeekerId/notes', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const notes = await storage.getCandidateNotes(req.params.jobSeekerId, employer.id);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching candidate notes:", error);
      res.status(500).json({ message: "Failed to fetch candidate notes" });
    }
  });

  app.post('/api/employer/candidates/:jobSeekerId/notes', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const validatedData = insertCandidateNoteSchema.parse({
        jobSeekerId: req.params.jobSeekerId,
        employerId: employer.id,
        createdBy: userId,
        note: req.body.note,
      });

      const note = await storage.createCandidateNote(validatedData);
      res.json(note);
    } catch (error) {
      console.error("Error creating candidate note:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid note data", errors: error });
      }
      res.status(500).json({ message: "Failed to create candidate note" });
    }
  });

  app.patch('/api/employer/candidates/notes/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const notes = await storage.getCandidateNotes(undefined, employer.id);
      const existingNote = notes.find(n => n.id === req.params.id);

      if (!existingNote) {
        return res.status(404).json({ message: "Note not found or access denied" });
      }

      const safeUpdateData = {
        note: req.body.note,
      };

      const validatedData = insertCandidateNoteSchema.partial().parse(safeUpdateData);
      const updated = await storage.updateCandidateNote(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating candidate note:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid note data", errors: error });
      }
      res.status(500).json({ message: "Failed to update candidate note" });
    }
  });

  app.delete('/api/employer/candidates/notes/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const notes = await storage.getCandidateNotes(undefined, employer.id);
      const note = notes.find(n => n.id === req.params.id);

      if (!note) {
        return res.status(404).json({ message: "Note not found or access denied" });
      }

      await storage.deleteCandidateNote(req.params.id);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting candidate note:", error);
      res.status(500).json({ message: "Failed to delete candidate note" });
    }
  });

  app.get('/api/employer/candidates/:jobSeekerId/ratings', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const ratings = await storage.getCandidateRatings(req.params.jobSeekerId, employer.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching candidate ratings:", error);
      res.status(500).json({ message: "Failed to fetch candidate ratings" });
    }
  });

  app.post('/api/employer/candidates/:jobSeekerId/ratings', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const validatedData = insertCandidateRatingSchema.parse({
        jobSeekerId: req.params.jobSeekerId,
        employerId: employer.id,
        createdBy: userId,
        rating: req.body.rating,
        category: req.body.category,
        feedback: req.body.feedback,
      });

      const rating = await storage.createCandidateRating(validatedData);
      res.json(rating);
    } catch (error) {
      console.error("Error creating candidate rating:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid rating data", errors: error });
      }
      res.status(500).json({ message: "Failed to create candidate rating" });
    }
  });

  app.patch('/api/employer/candidates/ratings/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const ratings = await storage.getCandidateRatings(undefined, employer.id);
      const existingRating = ratings.find(r => r.id === req.params.id);

      if (!existingRating) {
        return res.status(404).json({ message: "Rating not found or access denied" });
      }

      const safeUpdateData = {
        rating: req.body.rating,
        category: req.body.category,
        feedback: req.body.feedback,
      };

      const validatedData = insertCandidateRatingSchema.partial().parse(safeUpdateData);
      const updated = await storage.updateCandidateRating(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating candidate rating:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid rating data", errors: error });
      }
      res.status(500).json({ message: "Failed to update candidate rating" });
    }
  });

  app.post('/api/job-seeker/find-matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const { useEnhanced } = req.body;
      const jobs = await storage.getJobs();
      const matches = [];

      for (const job of jobs.slice(0, 10)) {
        const matchResult = useEnhanced 
          ? await matchingService.analyzeEnhancedMatch(jobSeeker, job)
          : await aiService.analyzeJobMatch(jobSeeker, job);
        
        if (matchResult.matchScore >= 50) {
          const match = await storage.createMatch({
            jobId: job.id,
            jobSeekerId: jobSeeker.id,
            matchScore: matchResult.matchScore,
            matchingSkills: matchResult.matchingSkills,
            gapSkills: matchResult.gapSkills,
            explanation: matchResult.explanation,
            aiMetadata: matchResult.aiMetadata || {
              breakdown: (matchResult as any).breakdown,
              semanticScore: (matchResult as any).semanticScore,
              keywordScore: (matchResult as any).keywordScore,
              experienceScore: (matchResult as any).experienceScore,
            },
          });
          matches.push(match);
        }
      }

      res.json(matches);
    } catch (error) {
      console.error("Error finding matches:", error);
      res.status(500).json({ message: "Failed to find matches" });
    }
  });

  app.get('/api/job-seeker/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const matches = await storage.getMatches(jobSeeker.id);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.patch('/api/matches/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMatchSchema.partial().parse(req.body);
      const updated = await storage.updateMatch(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid match data", errors: error });
      }
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  app.post('/api/job-seeker/skill-gap-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const { targetRole } = req.body;
      if (!targetRole || typeof targetRole !== 'string') {
        return res.status(400).json({ message: "Target role is required" });
      }
      
      const analysis = await aiService.analyzeSkillGaps(
        jobSeeker.skills || [],
        targetRole
      );

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing skill gaps:", error);
      res.status(500).json({ message: "Failed to analyze skill gaps" });
    }
  });

  app.post('/api/job-seeker/learning-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const { targetRole, targetSkills } = req.body;
      if (!targetRole || typeof targetRole !== 'string') {
        return res.status(400).json({ message: "Target role is required" });
      }
      if (!Array.isArray(targetSkills) || targetSkills.length === 0) {
        return res.status(400).json({ message: "Target skills array is required" });
      }
      
      const roadmap = await aiService.generateLearningPlan(
        jobSeeker.skills || [],
        targetSkills,
        targetRole
      );

      const existing = await storage.getLearningPlan(jobSeeker.id);
      
      let plan;
      if (existing) {
        plan = await storage.updateLearningPlan(existing.id, {
          targetRole,
          currentSkills: jobSeeker.skills,
          targetSkills,
          roadmap,
        });
      } else {
        plan = await storage.createLearningPlan({
          jobSeekerId: jobSeeker.id,
          targetRole,
          currentSkills: jobSeeker.skills,
          targetSkills,
          roadmap,
        });
      }

      res.json(plan);
    } catch (error) {
      console.error("Error generating learning plan:", error);
      res.status(500).json({ message: "Failed to generate learning plan" });
    }
  });

  app.get('/api/job-seeker/learning-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const plan = await storage.getLearningPlan(jobSeeker.id);
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning plan" });
    }
  });

  app.patch('/api/job-seeker/learning-plan/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLearningPlanSchema.partial().parse(req.body);
      const updated = await storage.updateLearningPlan(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid learning plan data", errors: error });
      }
      res.status(500).json({ message: "Failed to update learning plan" });
    }
  });

  app.get('/api/job-seeker/skill-evidence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const skill = req.query.skill as string | undefined;
      const evidence = await storage.getSkillEvidence(jobSeeker.id, skill);
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill evidence" });
    }
  });

  app.post('/api/job-seeker/skill-evidence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const validatedData = insertSkillEvidenceSchema.parse({
        ...req.body,
        jobSeekerId: jobSeeker.id,
      });
      
      const evidence = await storage.createSkillEvidence(validatedData);
      res.json(evidence);
    } catch (error) {
      console.error("Error creating skill evidence:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid evidence data", errors: error });
      }
      res.status(500).json({ message: "Failed to create skill evidence" });
    }
  });

  app.patch('/api/job-seeker/skill-evidence/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }
      
      const evidence = await storage.getSkillEvidence(jobSeeker.id);
      const targetEvidence = evidence.find(e => e.id === req.params.id);
      
      if (!targetEvidence || targetEvidence.jobSeekerId !== jobSeeker.id) {
        return res.status(403).json({ message: "Unauthorized to modify this evidence" });
      }
      
      const validatedData = insertSkillEvidenceSchema.partial().parse(req.body);
      const updated = await storage.updateSkillEvidence(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid evidence data", errors: error });
      }
      res.status(500).json({ message: "Failed to update skill evidence" });
    }
  });

  app.delete('/api/job-seeker/skill-evidence/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }
      
      const evidence = await storage.getSkillEvidence(jobSeeker.id);
      const targetEvidence = evidence.find(e => e.id === req.params.id);
      
      if (!targetEvidence || targetEvidence.jobSeekerId !== jobSeeker.id) {
        return res.status(403).json({ message: "Unauthorized to delete this evidence" });
      }
      
      await storage.deleteSkillEvidence(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skill evidence" });
    }
  });

  app.get('/api/job-seeker/endorsements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const skill = req.query.skill as string | undefined;
      const endorsements = await storage.getSkillEndorsements(jobSeeker.id, skill);
      res.json(endorsements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch endorsements" });
    }
  });

  app.post('/api/job-seeker/endorsements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { jobSeekerId } = req.body;
      
      if (!jobSeekerId) {
        return res.status(400).json({ message: "Job seeker ID is required" });
      }
      
      const targetJobSeeker = await storage.getJobSeekerById(jobSeekerId);
      if (!targetJobSeeker) {
        return res.status(404).json({ message: "Job seeker not found" });
      }
      
      if (targetJobSeeker.userId === userId) {
        return res.status(403).json({ message: "You cannot endorse yourself" });
      }
      
      const validatedData = insertSkillEndorsementSchema.parse({
        ...req.body,
        endorserId: userId,
      });
      
      const endorsement = await storage.createSkillEndorsement(validatedData);
      res.json(endorsement);
    } catch (error) {
      console.error("Error creating endorsement:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid endorsement data", errors: error });
      }
      res.status(500).json({ message: "Failed to create endorsement" });
    }
  });

  app.delete('/api/job-seeker/endorsements/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteSkillEndorsement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete endorsement" });
    }
  });

  app.get('/api/job-seeker/skill-tests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const skill = req.query.skill as string | undefined;
      const tests = await storage.getSkillTests(jobSeeker.id, skill);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill tests" });
    }
  });

  const testGenerationRateLimit = new Map<string, { count: number; resetAt: number }>();
  
  app.post('/api/job-seeker/skill-tests/:skill/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const now = Date.now();
      const userLimit = testGenerationRateLimit.get(userId);
      
      if (userLimit) {
        if (now < userLimit.resetAt) {
          if (userLimit.count >= 5) {
            return res.status(429).json({ 
              message: "Rate limit exceeded. Maximum 5 test generations per hour.",
              retryAfter: Math.ceil((userLimit.resetAt - now) / 1000)
            });
          }
          userLimit.count++;
        } else {
          testGenerationRateLimit.set(userId, { count: 1, resetAt: now + 3600000 });
        }
      } else {
        testGenerationRateLimit.set(userId, { count: 1, resetAt: now + 3600000 });
      }

      const { skill } = req.params;
      const { testType } = req.body;
      
      const questions = await aiService.generateSkillTest(skill, testType || 'technical');
      
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(500).json({ message: "Failed to generate valid test questions" });
      }
      
      res.json({ questions, skill, testType });
    } catch (error) {
      console.error("Error generating skill test:", error);
      res.status(500).json({ message: "Failed to generate skill test" });
    }
  });

  app.post('/api/job-seeker/skill-tests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const validatedData = insertSkillTestSchema.parse({
        ...req.body,
        jobSeekerId: jobSeeker.id,
      });
      
      const test = await storage.createSkillTest(validatedData);
      res.json(test);
    } catch (error) {
      console.error("Error saving skill test:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid test data", errors: error });
      }
      res.status(500).json({ message: "Failed to save skill test" });
    }
  });

  app.get('/api/job-seeker/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const achievements = await storage.getAchievements(jobSeeker.id);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post('/api/job-seeker/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const validatedData = insertAchievementSchema.parse({
        ...req.body,
        jobSeekerId: jobSeeker.id,
      });
      
      const achievement = await storage.createAchievement(validatedData);
      res.json(achievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid achievement data", errors: error });
      }
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  // ============================================
  // SKILL VERIFICATION API (for employers)
  // ============================================

  // Public endpoint to verify a candidate's skills (no auth required, uses job seeker ID)
  app.get('/api/verify/skills/:jobSeekerId', async (req: any, res) => {
    try {
      const { jobSeekerId } = req.params;

      // Get job seeker profile
      const jobSeeker = await storage.getJobSeekerById(jobSeekerId);
      if (!jobSeeker) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Check if profile is public
      if (jobSeeker.profileVisibility !== 'public') {
        return res.status(403).json({ message: "This profile is not publicly visible" });
      }

      // Get user info for name
      const user = await storage.getUser(jobSeeker.userId);

      // Get verified skills data
      const [skillTests, skillEvidence, endorsements] = await Promise.all([
        storage.getSkillTests(jobSeekerId),
        storage.getSkillEvidence(jobSeekerId),
        storage.getSkillEndorsements(jobSeekerId),
      ]);

      // Aggregate skill data
      const skillsMap: Record<string, any> = {};

      // Add test results
      for (const test of skillTests) {
        if (!skillsMap[test.skill]) {
          skillsMap[test.skill] = { skill: test.skill, tests: [], evidence: [], endorsements: [], verificationLevel: 'none' };
        }
        const percentage = Math.round((test.score / test.maxScore) * 100);
        skillsMap[test.skill].tests.push({
          score: percentage,
          testType: test.testType,
          completedAt: test.completedAt,
          percentile: test.percentile,
        });
      }

      // Add evidence
      for (const ev of skillEvidence) {
        if (!skillsMap[ev.skill]) {
          skillsMap[ev.skill] = { skill: ev.skill, tests: [], evidence: [], endorsements: [], verificationLevel: 'none' };
        }
        skillsMap[ev.skill].evidence.push({
          type: ev.evidenceType,
          title: ev.title,
          url: ev.url,
          verified: ev.verificationStatus === 'verified',
        });
      }

      // Add endorsements
      for (const end of endorsements) {
        if (!skillsMap[end.skill]) {
          skillsMap[end.skill] = { skill: end.skill, tests: [], evidence: [], endorsements: [], verificationLevel: 'none' };
        }
        skillsMap[end.skill].endorsements.push({
          relationship: end.relationship,
          rating: end.rating,
          verified: end.verified,
        });
      }

      // Calculate verification level for each skill
      for (const skill of Object.values(skillsMap)) {
        const hasTest = skill.tests.length > 0;
        const hasHighScore = skill.tests.some((t: any) => t.score >= 70);
        const hasEvidence = skill.evidence.length > 0;
        const hasVerifiedEvidence = skill.evidence.some((e: any) => e.verified);
        const hasEndorsements = skill.endorsements.length > 0;
        const endorsementCount = skill.endorsements.length;

        if (hasHighScore && hasVerifiedEvidence && endorsementCount >= 3) {
          skill.verificationLevel = 'expert';
        } else if (hasHighScore && (hasVerifiedEvidence || endorsementCount >= 2)) {
          skill.verificationLevel = 'advanced';
        } else if (hasTest || hasEvidence || hasEndorsements) {
          skill.verificationLevel = 'basic';
        }
      }

      res.json({
        jobSeekerId,
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous',
        skills: Object.values(skillsMap),
        verifiedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error verifying skills:", error);
      res.status(500).json({ message: "Failed to verify skills" });
    }
  });

  // Employer endpoint to verify a specific skill for a candidate
  app.get('/api/employer/verify-skill/:jobSeekerId/:skill', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);

      if (!employer) {
        return res.status(403).json({ message: "Only employers can access this endpoint" });
      }

      const { jobSeekerId, skill } = req.params;

      // Get skill-specific data
      const [skillTests, skillEvidence, endorsements] = await Promise.all([
        storage.getSkillTests(jobSeekerId, skill),
        storage.getSkillEvidence(jobSeekerId, skill),
        storage.getSkillEndorsements(jobSeekerId, skill),
      ]);

      // Calculate best test score
      const bestTest = skillTests.reduce((best: any, test: any) => {
        const percentage = Math.round((test.score / test.maxScore) * 100);
        if (!best || percentage > best.score) {
          return { ...test, score: percentage };
        }
        return best;
      }, null);

      // Calculate average endorsement rating
      const avgRating = endorsements.length > 0
        ? endorsements.reduce((sum: number, e: any) => sum + e.rating, 0) / endorsements.length
        : 0;

      res.json({
        skill,
        verified: skillTests.length > 0 || skillEvidence.some((e: any) => e.verificationStatus === 'verified'),
        testScore: bestTest?.score || null,
        testDate: bestTest?.completedAt || null,
        evidenceCount: skillEvidence.length,
        endorsementCount: endorsements.length,
        averageEndorsementRating: Math.round(avgRating * 10) / 10,
        details: {
          tests: skillTests.map((t: any) => ({
            score: Math.round((t.score / t.maxScore) * 100),
            type: t.testType,
            date: t.completedAt,
          })),
          evidence: skillEvidence.map((e: any) => ({
            type: e.evidenceType,
            title: e.title,
            verified: e.verificationStatus === 'verified',
          })),
          endorsements: endorsements.map((e: any) => ({
            relationship: e.relationship,
            rating: e.rating,
          })),
        },
      });
    } catch (error) {
      console.error("Error verifying skill:", error);
      res.status(500).json({ message: "Failed to verify skill" });
    }
  });

  app.post('/api/matches/:matchId/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMatchFeedbackSchema.parse({
        ...req.body,
        matchId: req.params.matchId,
      });
      
      const feedback = await storage.createMatchFeedback(validatedData);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating match feedback:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid feedback data", errors: error });
      }
      res.status(500).json({ message: "Failed to save feedback" });
    }
  });

  app.get('/api/matches/:matchId/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const feedback = await storage.getMatchFeedback(req.params.matchId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch match feedback" });
    }
  });

  app.get('/api/matching/weights', isAuthenticated, async (req: any, res) => {
    try {
      const weights = await storage.getMatchingWeights();
      res.json(weights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matching weights" });
    }
  });

  app.post('/api/matching/weights', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can create matching weights" });
      }
      
      const validatedData = insertMatchingWeightSchema.parse(req.body);
      
      if (validatedData.weight < 0 || validatedData.weight > 100) {
        return res.status(400).json({ message: "Weight must be between 0 and 100" });
      }
      
      const weight = await storage.createMatchingWeight(validatedData);
      res.json(weight);
    } catch (error) {
      console.error("Error creating matching weight:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid weight data", errors: error });
      }
      res.status(500).json({ message: "Failed to create matching weight" });
    }
  });

  app.patch('/api/matching/weights/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can modify matching weights" });
      }
      
      const validatedData = insertMatchingWeightSchema.partial().parse(req.body);
      
      if (validatedData.weight !== undefined && (validatedData.weight < 0 || validatedData.weight > 100)) {
        return res.status(400).json({ message: "Weight must be between 0 and 100" });
      }
      
      const updated = await storage.updateMatchingWeight(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid weight data", errors: error });
      }
      res.status(500).json({ message: "Failed to update matching weight" });
    }
  });

  app.post('/api/matches/:matchId/process-feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }
      
      const matches = await storage.getMatches(jobSeeker.id);
      const match = matches.find(m => m.id === req.params.matchId);
      
      if (!match) {
        return res.status(403).json({ message: "Unauthorized to provide feedback on this match" });
      }
      
      const { feedbackType, factors } = req.body;
      
      if (!['accept', 'reject'].includes(feedbackType)) {
        return res.status(400).json({ message: "Feedback type must be 'accept' or 'reject'" });
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for your feedback. This helps improve future matches." 
      });
    } catch (error) {
      console.error("Error processing match feedback:", error);
      res.status(500).json({ message: "Failed to process feedback" });
    }
  });

  app.post('/api/job-seeker/github/import', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      if (!user?.githubId) {
        return res.status(400).json({ message: "GitHub account not connected" });
      }

      const githubToken = req.session?.githubAccessToken;
      if (!githubToken) {
        return res.status(401).json({ message: "GitHub authentication required. Please re-authenticate with GitHub." });
      }

      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        console.error("GitHub API error:", response.status, await response.text());
        return res.status(response.status).json({ message: "Failed to fetch GitHub repositories" });
      }

      const repos = await response.json();
      
      const existingRepos = await storage.getGithubRepos(jobSeeker.id);
      const existingRepoUrls = new Set(existingRepos.map(r => r.repoUrl));

      const importedRepos = [];
      for (const repo of repos) {
        if (!repo.private && !existingRepoUrls.has(repo.html_url)) {
          const importedRepo = await storage.createGithubRepo({
            jobSeekerId: jobSeeker.id,
            repoName: repo.full_name,
            repoUrl: repo.html_url,
            description: repo.description || null,
            language: repo.language || null,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            topics: repo.topics || [],
            lastUpdated: repo.updated_at ? new Date(repo.updated_at) : null,
          });
          importedRepos.push(importedRepo);
        }
      }

      res.json({
        message: `Successfully imported ${importedRepos.length} repositories`,
        imported: importedRepos.length,
        total: repos.length,
        repositories: importedRepos,
      });
    } catch (error) {
      console.error("Error importing GitHub repos:", error);
      res.status(500).json({ message: "Failed to import GitHub repositories" });
    }
  });

  app.get('/api/job-seeker/github/repos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const repos = await storage.getGithubRepos(jobSeeker.id);
      res.json(repos);
    } catch (error) {
      console.error("Error fetching GitHub repos:", error);
      res.status(500).json({ message: "Failed to fetch GitHub repositories" });
    }
  });

  app.delete('/api/job-seeker/github/repos/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteGithubRepo(req.params.id);
      res.json({ message: "Repository removed successfully" });
    } catch (error) {
      console.error("Error deleting GitHub repo:", error);
      res.status(500).json({ message: "Failed to remove repository" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const tenants = await storage.getTenants();
      const users = await storage.getAllUsers();
      const jobs = await storage.getJobs();
      const applications = await storage.getAllApplications();

      res.json({
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.status === 'active').length,
        totalUsers: users.length,
        activeUsers: users.filter(u => u.role === 'job_seeker' || u.role === 'employer').length,
        totalJobs: jobs.length,
        totalApplications: applications.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/tenants', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // System Health Metrics endpoint
  app.get('/api/admin/system-health', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const startTime = Date.now();

      // Test database connectivity
      const tenants = await storage.getTenants();
      const dbResponseTime = Date.now() - startTime;

      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

      // Get uptime
      const uptimeSeconds = process.uptime();
      const uptimeHours = Math.floor(uptimeSeconds / 3600);
      const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

      // Get system stats
      const users = await storage.getAllUsers();
      const jobs = await storage.getJobs();
      const applications = await storage.getAllApplications();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          apiResponseTime: `${dbResponseTime}ms`,
          databaseStatus: dbResponseTime < 1000 ? 'operational' : 'degraded',
          memoryUsage: {
            used: `${usedMemoryMB} MB`,
            total: `${totalMemoryMB} MB`,
            percentage: Math.round((usedMemoryMB / totalMemoryMB) * 100),
          },
          uptime: `${uptimeHours}h ${uptimeMinutes}m`,
          nodeVersion: process.version,
        },
        services: [
          {
            name: 'Web Application',
            status: 'operational',
            uptime: '99.98%',
            lastCheck: new Date().toISOString()
          },
          {
            name: 'API Server',
            status: 'operational',
            uptime: '99.95%',
            responseTime: `${dbResponseTime}ms`
          },
          {
            name: 'Database',
            status: dbResponseTime < 1000 ? 'operational' : 'degraded',
            uptime: '99.99%',
            connections: '12 / 100'
          },
          {
            name: 'Authentication Service',
            status: 'operational',
            uptime: '100%'
          },
        ],
        database: {
          totalTenants: tenants.length,
          totalUsers: users.length,
          totalJobs: jobs.length,
          totalApplications: applications.length,
        }
      });
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({
        status: 'error',
        message: "Failed to fetch system health",
        timestamp: new Date().toISOString()
      });
    }
  });

  // User Management CRUD endpoints
  app.patch('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const { role, firstName, lastName, email } = req.body;

      const updateData: any = {};
      if (role && ['admin', 'employer', 'job_seeker'].includes(role)) {
        updateData.role = role;
      }
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;

      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;

      // Don't allow deleting self
      if (id === adminId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Tenant Management CRUD endpoints
  app.post('/api/admin/tenants', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const tenantSchema = z.object({
        name: z.string().min(2),
        plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
        status: z.enum(['active', 'trial', 'suspended', 'canceled']).default('trial'),
      });

      const validatedData = tenantSchema.parse(req.body);
      const tenant = await storage.createTenant(validatedData);
      res.status(201).json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  app.patch('/api/admin/tenants/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const { name, plan, status } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (plan && ['free', 'starter', 'professional', 'enterprise'].includes(plan)) {
        updateData.plan = plan;
      }
      if (status && ['active', 'trial', 'suspended', 'canceled'].includes(status)) {
        updateData.status = status;
      }

      const updatedTenant = await storage.updateTenant(id, updateData);
      res.json(updatedTenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  app.delete('/api/admin/tenants/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      await storage.deleteTenant(id);
      res.json({ success: true, message: "Tenant deleted successfully" });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Feature Flags endpoints
  app.get('/api/admin/feature-flags', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ message: "Failed to fetch feature flags" });
    }
  });

  app.post('/api/admin/feature-flags', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const flagSchema = z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        enabled: z.boolean().default(false),
        category: z.enum(['general', 'ai', 'billing', 'security', 'experimental']).default('general'),
      });

      const validatedData = flagSchema.parse(req.body);
      const flag = await storage.createFeatureFlag(validatedData);
      res.status(201).json(flag);
    } catch (error) {
      console.error("Error creating feature flag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create feature flag" });
    }
  });

  app.patch('/api/admin/feature-flags/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const { enabled, name, description, category, tenantOverrides } = req.body;

      const updateData: any = {};
      if (typeof enabled === 'boolean') updateData.enabled = enabled;
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category) updateData.category = category;
      if (tenantOverrides) updateData.tenantOverrides = tenantOverrides;

      const updatedFlag = await storage.updateFeatureFlag(id, updateData);
      res.json(updatedFlag);
    } catch (error) {
      console.error("Error updating feature flag:", error);
      res.status(500).json({ message: "Failed to update feature flag" });
    }
  });

  app.delete('/api/admin/feature-flags/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      await storage.deleteFeatureFlag(id);
      res.json({ success: true, message: "Feature flag deleted successfully" });
    } catch (error) {
      console.error("Error deleting feature flag:", error);
      res.status(500).json({ message: "Failed to delete feature flag" });
    }
  });

  // Audit Logs endpoints
  app.get('/api/admin/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { userId, tenantId, action, resource, startDate, endDate, limit, offset } = req.query;

      const filters: any = {};
      if (userId) filters.userId = userId;
      if (tenantId) filters.tenantId = tenantId;
      if (action) filters.action = action;
      if (resource) filters.resource = resource;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get('/api/job-seeker/billing/status', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.json({
          stripeConfigured: false,
          configured: false,
          message: "Stripe is not configured. Subscription features are coming soon."
        });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (tenant?.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
          const currentPeriodEnd = (subscription as any).current_period_end || 0;
          return res.json({
            stripeConfigured: true,
            configured: true,
            hasSubscription: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              current_period_end: typeof currentPeriodEnd === 'number' ? currentPeriodEnd : Number(currentPeriodEnd),
              plan: subscription.items.data[0]?.price.nickname || tenant.plan,
            }
          });
        } catch (error) {
          console.error("Error retrieving subscription:", error);
        }
      }

      res.json({
        stripeConfigured: true,
        configured: true,
        hasSubscription: false,
        plan: tenant?.plan || 'free',
      });
    } catch (error) {
      console.error("Error fetching billing status:", error);
      res.status(500).json({ message: "Failed to fetch billing status" });
    }
  });

  app.get('/api/employer/billing/status', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.json({
          configured: false,
          message: "Stripe is not configured. Please contact administrator."
        });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (tenant?.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
          const currentPeriodEnd = (subscription as any).current_period_end || 0;
          return res.json({
            configured: true,
            hasSubscription: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: typeof currentPeriodEnd === 'number' ? currentPeriodEnd : Number(currentPeriodEnd),
              plan: subscription.items.data[0]?.price.nickname || tenant.plan,
            }
          });
        } catch (error) {
          console.error("Error retrieving subscription:", error);
        }
      }

      res.json({
        configured: true,
        hasSubscription: false,
        plan: tenant?.plan || 'free',
      });
    } catch (error) {
      console.error("Error fetching billing status:", error);
      res.status(500).json({ message: "Failed to fetch billing status" });
    }
  });

  app.post('/api/employer/billing/create-checkout', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      let tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;
      
      if (!tenant) {
        tenant = await storage.createTenant({
          name: employer.companyName,
          plan: 'free',
          status: 'active',
        });
        await storage.upsertUser({
          ...user!,
          tenantId: tenant.id,
        });
      }

      let customerId = tenant.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          name: employer.companyName,
          metadata: {
            tenantId: tenant.id,
          },
        });
        customerId = customer.id;
        await storage.updateTenant(tenant.id, {
          stripeCustomerId: customer.id,
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'SkillSync AI Pro Plan',
                description: 'Unlimited job postings and AI-powered candidate matching',
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: 9900,
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/employer/billing?success=true`,
        cancel_url: `${req.headers.origin}/employer/billing?canceled=true`,
        subscription_data: {
          metadata: {
            tenantId: tenant.id,
          },
        },
        metadata: {
          tenantId: tenant.id,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post('/api/employer/billing/create-portal', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;
      
      if (!tenant?.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: `${req.headers.origin}/employer/billing`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.post('/api/stripe-webhook', async (req: any, res) => {
    if (!stripe) {
      return res.status(503).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const rawBody = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;
        const planId = subscription.metadata.planId || 'pro';

        if (tenantId) {
          const planMapping: Record<string, string> = {
            'starter': 'starter',
            'growth': 'growth',
            'seeker_pro': 'pro',
            'pro': 'pro'
          };

          await storage.updateTenant(tenantId, {
            stripeSubscriptionId: subscription.id,
            plan: subscription.status === 'active' ? (planMapping[planId] || 'pro') : 'free',
            status: subscription.status === 'active' ? 'active' :
                    subscription.status === 'past_due' ? 'past_due' :
                    subscription.status === 'canceled' ? 'canceled' : 'inactive',
          });

          // Log billing event
          try {
            await storage.createAuditLog({
              tenantId,
              action: 'subscription.updated',
              resource: 'billing',
              resourceId: subscription.id,
              details: {
                status: subscription.status,
                plan: planId,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
            });
          } catch (e) {
            console.error('Failed to create audit log for subscription update:', e);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;

        if (tenantId) {
          await storage.updateTenant(tenantId, {
            stripeSubscriptionId: null,
            plan: 'free',
            status: 'active', // Still active but on free plan
          });

          try {
            await storage.createAuditLog({
              tenantId,
              action: 'subscription.canceled',
              resource: 'billing',
              resourceId: subscription.id,
              details: { canceledAt: new Date().toISOString() },
            });
          } catch (e) {
            console.error('Failed to create audit log for subscription cancellation:', e);
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find tenant by Stripe customer ID
        const tenants = await storage.getTenants();
        const tenant = tenants.find(t => t.stripeCustomerId === customerId);

        if (tenant) {
          await storage.updateTenant(tenant.id, {
            status: 'past_due',
          });

          try {
            await storage.createAuditLog({
              tenantId: tenant.id,
              action: 'payment.failed',
              resource: 'billing',
              resourceId: invoice.id || '',
              details: {
                amountDue: invoice.amount_due,
                attemptCount: invoice.attempt_count,
                nextPaymentAttempt: invoice.next_payment_attempt,
              },
            });
          } catch (e) {
            console.error('Failed to create audit log for payment failure:', e);
          }

          // TODO: Send email notification about failed payment
          console.log(`[BILLING] Payment failed for tenant ${tenant.id}. Invoice: ${invoice.id}`);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const tenantsForInvoice = await storage.getTenants();
        const tenant = tenantsForInvoice.find(t => t.stripeCustomerId === customerId);

        if (tenant && tenant.status === 'past_due') {
          await storage.updateTenant(tenant.id, {
            status: 'active',
          });

          try {
            await storage.createAuditLog({
              tenantId: tenant.id,
              action: 'payment.succeeded',
              resource: 'billing',
              resourceId: invoice.id || '',
              details: { amountPaid: invoice.amount_paid },
            });
          } catch (e) {
            console.error('Failed to create audit log for payment success:', e);
          }
        }
        break;
      }
    }

    res.json({ received: true });
  });

  // Billing Plans Configuration
  const BILLING_PLANS = {
    free: {
      name: 'Free',
      price: 0,
      interval: 'forever',
      features: ['Up to 3 active job postings', 'Basic AI matching', '10 matches per month'],
      limits: { jobPostings: 3, matchesPerMonth: 10, teamMembers: 1 }
    },
    starter: {
      name: 'Starter',
      price: 4900, // cents
      interval: 'month',
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
      features: ['Up to 10 active job postings', 'Advanced AI matching', 'Unlimited matches', 'Up to 3 team members'],
      limits: { jobPostings: 10, matchesPerMonth: -1, teamMembers: 3 }
    },
    growth: {
      name: 'Growth',
      price: 14900, // cents
      interval: 'month',
      stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID,
      features: ['Unlimited job postings', 'Premium AI matching', 'Up to 10 team members', 'All integrations'],
      limits: { jobPostings: -1, matchesPerMonth: -1, teamMembers: 10 }
    },
    enterprise: {
      name: 'Enterprise',
      price: null, // Custom pricing
      interval: 'month',
      features: ['Everything in Growth', 'Unlimited team members', 'Dedicated support', 'Custom integrations'],
      limits: { jobPostings: -1, matchesPerMonth: -1, teamMembers: -1 }
    },
    // Job Seeker Plans
    seeker_free: {
      name: 'Free',
      price: 0,
      interval: 'forever',
      features: ['5 applications per month', 'Basic job matching', 'Skill gap analysis'],
      limits: { applicationsPerMonth: 5 }
    },
    seeker_pro: {
      name: 'Pro',
      price: 2900, // cents
      interval: 'month',
      stripePriceId: process.env.STRIPE_SEEKER_PRO_PRICE_ID,
      features: ['Unlimited applications', 'Priority matching', 'Advanced analytics', 'Learning roadmaps'],
      limits: { applicationsPerMonth: -1 }
    }
  };

  // ============================================
  // USAGE TRACKING HELPERS
  // ============================================

  type FeatureType = 'job_posting' | 'application' | 'ai_match' | 'ai_test' | 'resume_parse' | 'webhook_call' | 'api_call';

  const FEATURE_LIMITS: Record<string, Record<FeatureType, number>> = {
    // Employer plans
    free: { job_posting: 3, application: -1, ai_match: 10, ai_test: 0, resume_parse: 0, webhook_call: 0, api_call: 100 },
    starter: { job_posting: 10, application: -1, ai_match: -1, ai_test: -1, resume_parse: 50, webhook_call: 100, api_call: 1000 },
    growth: { job_posting: -1, application: -1, ai_match: -1, ai_test: -1, resume_parse: -1, webhook_call: -1, api_call: -1 },
    enterprise: { job_posting: -1, application: -1, ai_match: -1, ai_test: -1, resume_parse: -1, webhook_call: -1, api_call: -1 },
    // Job seeker plans
    seeker_free: { job_posting: 0, application: 5, ai_match: 10, ai_test: 3, resume_parse: 1, webhook_call: 0, api_call: 50 },
    seeker_pro: { job_posting: 0, application: -1, ai_match: -1, ai_test: -1, resume_parse: -1, webhook_call: 0, api_call: -1 },
  };

  function getCurrentPeriodMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function getBillingPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  async function trackUsage(
    userId: string,
    tenantId: string | null,
    featureType: FeatureType,
    quantity: number = 1,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; usage: number; limit: number; remaining: number }> {
    const periodMonth = getCurrentPeriodMonth();
    const { start, end } = getBillingPeriod();

    // Get user's plan to determine limits
    const user = await storage.getUser(userId);
    let planId = 'free';

    if (user?.role === 'employer') {
      // For employers, tenantId is on the user record
      if (user.tenantId) {
        const tenant = await storage.getTenant(user.tenantId);
        planId = tenant?.plan || 'free';
      }
    } else if (user?.role === 'job_seeker') {
      // For job seekers, check tenant subscription if they have one
      if (user.tenantId) {
        const tenant = await storage.getTenant(user.tenantId);
        planId = tenant?.plan === 'pro' ? 'seeker_pro' : 'seeker_free';
      } else {
        planId = 'seeker_free';
      }
    }

    const limit = FEATURE_LIMITS[planId]?.[featureType] ?? 0;

    // Get current usage
    const currentAggregate = await storage.getUsageAggregate(userId, featureType, periodMonth);
    const currentUsage = currentAggregate?.totalUsage || 0;

    // Check if limit would be exceeded (-1 means unlimited)
    if (limit !== -1 && currentUsage + quantity > limit) {
      return {
        success: false,
        usage: currentUsage,
        limit,
        remaining: Math.max(0, limit - currentUsage),
      };
    }

    // Record the usage
    await storage.recordUsage({
      userId,
      tenantId,
      featureType,
      quantity,
      metadata,
      billingPeriodStart: start,
      billingPeriodEnd: end,
    });

    // Update aggregate
    const updated = await storage.upsertUsageAggregate(
      userId,
      tenantId,
      featureType,
      periodMonth,
      quantity,
      limit === -1 ? undefined : limit
    );

    return {
      success: true,
      usage: updated.totalUsage,
      limit: limit === -1 ? -1 : limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - updated.totalUsage),
    };
  }

  async function checkUsageLimit(
    userId: string,
    featureType: FeatureType,
    requiredQuantity: number = 1
  ): Promise<{ allowed: boolean; usage: number; limit: number; remaining: number }> {
    const periodMonth = getCurrentPeriodMonth();

    // Get user's plan to determine limits
    const user = await storage.getUser(userId);
    let planId = 'free';

    if (user?.role === 'employer') {
      if (user.tenantId) {
        const tenant = await storage.getTenant(user.tenantId);
        planId = tenant?.plan || 'free';
      }
    } else if (user?.role === 'job_seeker') {
      if (user.tenantId) {
        const tenant = await storage.getTenant(user.tenantId);
        planId = tenant?.plan === 'pro' ? 'seeker_pro' : 'seeker_free';
      } else {
        planId = 'seeker_free';
      }
    }

    const limit = FEATURE_LIMITS[planId]?.[featureType] ?? 0;

    // Get current usage
    const currentAggregate = await storage.getUsageAggregate(userId, featureType, periodMonth);
    const currentUsage = currentAggregate?.totalUsage || 0;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, usage: currentUsage, limit: -1, remaining: -1 };
    }

    const remaining = Math.max(0, limit - currentUsage);
    return {
      allowed: currentUsage + requiredQuantity <= limit,
      usage: currentUsage,
      limit,
      remaining,
    };
  }

  // ============================================
  // USAGE TRACKING API ENDPOINTS
  // ============================================

  // Get current user's usage summary
  app.get('/api/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const periodMonth = getCurrentPeriodMonth();

      const user = await storage.getUser(userId);
      let planId = 'free';
      let tenantId = user?.tenantId || null;

      if (user?.role === 'employer') {
        if (user.tenantId) {
          const tenant = await storage.getTenant(user.tenantId);
          planId = tenant?.plan || 'free';
        }
      } else if (user?.role === 'job_seeker') {
        if (user.tenantId) {
          const tenant = await storage.getTenant(user.tenantId);
          planId = tenant?.plan === 'pro' ? 'seeker_pro' : 'seeker_free';
        } else {
          planId = 'seeker_free';
        }
      }

      const aggregates = await storage.getUserUsageSummary(userId, periodMonth);
      const limits = FEATURE_LIMITS[planId] || FEATURE_LIMITS.free;

      // Build usage summary with all feature types
      const featureTypes: FeatureType[] = ['job_posting', 'application', 'ai_match', 'ai_test', 'resume_parse', 'webhook_call', 'api_call'];
      const usage = featureTypes.map(featureType => {
        const aggregate = aggregates.find(a => a.featureType === featureType);
        const limit = limits[featureType];
        const used = aggregate?.totalUsage || 0;

        return {
          featureType,
          used,
          limit: limit === -1 ? 'unlimited' : limit,
          remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - used),
          percentUsed: limit === -1 ? 0 : limit === 0 ? 100 : Math.round((used / limit) * 100),
        };
      });

      res.json({
        periodMonth,
        plan: planId,
        usage,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  // Get usage history (detailed records)
  app.get('/api/usage/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { featureType, startDate, endDate } = req.query;

      const records = await storage.getUsageRecords(
        userId,
        featureType as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({ records });
    } catch (error) {
      console.error("Error fetching usage history:", error);
      res.status(500).json({ message: "Failed to fetch usage history" });
    }
  });

  // Check if a specific action is allowed
  app.get('/api/usage/check/:featureType', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { featureType } = req.params;
      const { quantity = '1' } = req.query;

      const result = await checkUsageLimit(userId, featureType as FeatureType, parseInt(quantity as string));
      res.json(result);
    } catch (error) {
      console.error("Error checking usage limit:", error);
      res.status(500).json({ message: "Failed to check usage limit" });
    }
  });

  // Admin: Get tenant usage summary
  app.get('/api/admin/usage/:tenantId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const adminUser = await storage.getUser(userId);

      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { tenantId } = req.params;
      const { periodMonth = getCurrentPeriodMonth() } = req.query;

      const aggregates = await storage.getTenantUsageSummary(tenantId, periodMonth as string);

      res.json({ tenantId, periodMonth, aggregates });
    } catch (error) {
      console.error("Error fetching tenant usage:", error);
      res.status(500).json({ message: "Failed to fetch tenant usage" });
    }
  });

  // Get available plans
  app.get('/api/billing/plans', async (req, res) => {
    const { type } = req.query;

    if (type === 'employer') {
      res.json({
        plans: [
          { id: 'free', ...BILLING_PLANS.free },
          { id: 'starter', ...BILLING_PLANS.starter, price: BILLING_PLANS.starter.price / 100 },
          { id: 'growth', ...BILLING_PLANS.growth, price: BILLING_PLANS.growth.price / 100 },
          { id: 'enterprise', ...BILLING_PLANS.enterprise }
        ]
      });
    } else {
      res.json({
        plans: [
          { id: 'seeker_free', ...BILLING_PLANS.seeker_free },
          { id: 'seeker_pro', ...BILLING_PLANS.seeker_pro, price: BILLING_PLANS.seeker_pro.price / 100 }
        ]
      });
    }
  });

  // Job Seeker checkout
  app.post('/api/job-seeker/billing/create-checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const jobSeeker = await storage.getJobSeeker(userId);

      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const { planId = 'seeker_pro' } = req.body;
      const plan = BILLING_PLANS[planId as keyof typeof BILLING_PLANS];

      if (!plan || plan.price === 0 || plan.price === null) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      let tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (!tenant) {
        tenant = await storage.createTenant({
          name: `${user?.firstName || 'User'}'s Account`,
          plan: 'free',
          status: 'active',
        });
        await storage.upsertUser({
          ...user!,
          tenantId: tenant.id,
        });
      }

      let customerId = tenant.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || undefined,
          metadata: {
            tenantId: tenant.id,
            userType: 'job_seeker',
          },
        });
        customerId = customer.id;
        await storage.updateTenant(tenant.id, {
          stripeCustomerId: customer.id,
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `SkillSync AI ${plan.name} Plan`,
                description: plan.features.join(', '),
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: plan.price as number,
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard/billing?success=true`,
        cancel_url: `${req.headers.origin}/dashboard/billing?canceled=true`,
        subscription_data: {
          metadata: {
            tenantId: tenant.id,
            planId,
          },
        },
        metadata: {
          tenantId: tenant.id,
          planId,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating job seeker checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Job seeker billing portal
  app.post('/api/job-seeker/billing/create-portal', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (!tenant?.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: `${req.headers.origin}/dashboard/billing`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating job seeker portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Get invoices
  app.get('/api/billing/invoices', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.json({ invoices: [], stripeConfigured: false });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (!tenant?.stripeCustomerId) {
        return res.json({ invoices: [], stripeConfigured: true });
      }

      const invoices = await stripe.invoices.list({
        customer: tenant.stripeCustomerId,
        limit: 20,
      });

      res.json({
        stripeConfigured: true,
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          amountDue: inv.amount_due,
          amountPaid: inv.amount_paid,
          currency: inv.currency,
          created: inv.created,
          periodStart: inv.period_start,
          periodEnd: inv.period_end,
          invoicePdf: inv.invoice_pdf,
          hostedInvoiceUrl: inv.hosted_invoice_url,
        }))
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Employer plan upgrade/downgrade with proration
  app.post('/api/employer/billing/change-plan', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (!tenant?.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const { planId } = req.body;
      const newPlan = BILLING_PLANS[planId as keyof typeof BILLING_PLANS];

      if (!newPlan || !('stripePriceId' in newPlan) || !newPlan.stripePriceId) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);

      // Update subscription with proration
      const updatedSubscription = await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPlan.stripePriceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          ...subscription.metadata,
          planId,
        },
      });

      await storage.updateTenant(tenant.id, {
        plan: planId,
      });

      res.json({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          plan: planId,
        }
      });
    } catch (error) {
      console.error("Error changing plan:", error);
      res.status(500).json({ message: "Failed to change plan" });
    }
  });

  // Cancel subscription
  app.post('/api/billing/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (!tenant?.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const { cancelAtPeriodEnd = true } = req.body;

      if (cancelAtPeriodEnd) {
        // Cancel at period end (user keeps access until billing period ends)
        await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        // Cancel immediately
        await stripe.subscriptions.cancel(tenant.stripeSubscriptionId);
      }

      res.json({ success: true, cancelAtPeriodEnd });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Reactivate subscription (if canceled but not yet expired)
  app.post('/api/billing/reactivate-subscription', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const tenant = user?.tenantId ? await storage.getTenant(user.tenantId) : null;

      if (!tenant?.stripeSubscriptionId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ message: "Failed to reactivate subscription" });
    }
  });

  app.get('/api/employer/team/members', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(404).json({ message: "No team found" });
      }

      const members = await storage.getTeamMembers(user.tenantId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/employer/team/invitations', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(404).json({ message: "No team found" });
      }

      const invitations = await storage.getTeamInvitations(user.tenantId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post('/api/employer/team/invite', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(403).json({ message: "Only employers can invite team members" });
      }

      let tenantId = user?.tenantId;
      
      if (!tenantId) {
        const tenant = await storage.createTenant({
          name: employer.companyName,
          plan: 'free',
          status: 'active',
        });
        tenantId = tenant.id;
        await storage.upsertUser({
          ...user!,
          tenantId: tenant.id,
        });
      }

      const data = insertTeamInvitationSchema.extend({
        email: insertTeamInvitationSchema.shape.email.email(),
      }).parse({
        ...req.body,
        tenantId,
        invitedBy: userId,
        token: randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const invitation = await storage.createTeamInvitation(data);
      res.json(invitation);
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      res.status(400).json({ message: error.message || "Failed to create invitation" });
    }
  });

  app.delete('/api/employer/team/invitation/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const invitationId = req.params.id;
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const invitations = await storage.getTeamInvitations(user.tenantId);
      const invitation = invitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      await storage.updateTeamInvitation(invitationId, { status: 'revoked' });
      res.json({ message: "Invitation revoked" });
    } catch (error) {
      console.error("Error revoking invitation:", error);
      res.status(500).json({ message: "Failed to revoke invitation" });
    }
  });

  app.get('/api/interviews', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = req.query.applicationId as string | undefined;
      const interviews = await storage.getInterviews(applicationId);
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  app.get('/api/interviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const interviewId = req.params.id;
      const interview = await storage.getInterviewById(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      res.json(interview);
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ message: "Failed to fetch interview" });
    }
  });

  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden - no tenant" });
      }

      const integrationType = req.query.type as string | undefined;
      const configs = await storage.getIntegrationConfigs(user.tenantId, integrationType);
      res.json(configs);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/integrations', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden - no tenant" });
      }

      const validatedData = insertIntegrationConfigSchema.parse({
        ...req.body,
        tenantId: user.tenantId,
      });

      const config = await storage.createIntegrationConfig(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error creating integration:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid integration data", errors: error });
      }
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.patch('/api/integrations/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden - no tenant" });
      }

      const validatedData = insertIntegrationConfigSchema.partial().parse(req.body);
      const updated = await storage.updateIntegrationConfig(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  app.delete('/api/integrations/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      await storage.deleteIntegrationConfig(req.params.id);
      res.json({ message: "Integration deleted successfully" });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  const githubService = new (await import('./githubService')).GitHubService(storage);
  const slackService = new (await import('./slackService')).SlackService(storage);

  app.post('/api/integrations/slack/test', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const { config } = req.body;
      const result = await slackService.testConnection(config);
      res.json({ success: result });
    } catch (error) {
      console.error("Error testing Slack integration:", error);
      res.status(500).json({ message: "Failed to test Slack integration" });
    }
  });

  app.post('/api/integrations/slack/digest', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden - no tenant" });
      }

      await slackService.sendDailyDigest(user.tenantId);
      res.json({ message: "Digest sent successfully" });
    } catch (error) {
      console.error("Error sending Slack digest:", error);
      res.status(500).json({ message: "Failed to send digest" });
    }
  });

  app.post('/api/github/import', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const { githubUsername } = req.body;
      
      if (!githubUsername) {
        return res.status(400).json({ message: "GitHub username is required" });
      }

      const repos = await githubService.importUserRepos(jobSeeker.id, githubUsername);
      res.json({ imported: repos.length, repos });
    } catch (error) {
      console.error("Error importing GitHub repos:", error);
      res.status(500).json({ message: "Failed to import GitHub repos" });
    }
  });

  app.post('/api/github/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const { githubUsername } = req.body;
      
      if (!githubUsername) {
        return res.status(400).json({ message: "GitHub username is required" });
      }

      const result = await githubService.syncRepoData(jobSeeker.id, githubUsername);
      res.json(result);
    } catch (error) {
      console.error("Error syncing GitHub repos:", error);
      res.status(500).json({ message: "Failed to sync GitHub repos" });
    }
  });

  app.post('/api/github/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { githubUsername } = req.body;
      
      if (!githubUsername) {
        return res.status(400).json({ message: "GitHub username is required" });
      }

      const activity = await githubService.analyzeActivity(githubUsername);
      res.json(activity);
    } catch (error) {
      console.error("Error analyzing GitHub activity:", error);
      res.status(500).json({ message: "Failed to analyze GitHub activity" });
    }
  });

  app.get('/api/github/repos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const repos = await storage.getGithubRepos(jobSeeker.id);
      res.json(repos);
    } catch (error) {
      console.error("Error fetching GitHub repos:", error);
      res.status(500).json({ message: "Failed to fetch GitHub repos" });
    }
  });

  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const paginationSchema = z.object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0)
      });
      
      const { limit, offset } = paginationSchema.parse(req.query);
      
      const notifications = await storage.getNotifications(userId, limit, offset);
      
      res.json(notifications);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: error.errors 
        });
      }
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notification = await storage.getNotificationById(req.params.id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updated = await storage.markNotificationAsRead(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        userId,
        tenantId: user?.tenantId,
      });

      const notification = await storage.createNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid notification data", errors: error });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Notification Preferences
  const NOTIFICATION_CHANNELS = ['email', 'in_app', 'slack'] as const;
  const NOTIFICATION_CATEGORIES = [
    'application_updates',
    'interview_reminders',
    'job_matches',
    'messages',
    'system_alerts',
    'marketing',
  ] as const;

  app.get('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getNotificationPreferences(userId);

      // Return preferences with defaults for missing channels
      const prefsMap: Record<string, any> = {};
      for (const pref of preferences) {
        prefsMap[pref.channel] = pref;
      }

      // Ensure all channels have preferences
      const result = NOTIFICATION_CHANNELS.map(channel => {
        if (prefsMap[channel]) {
          return prefsMap[channel];
        }
        // Return default structure for missing channels
        return {
          channel,
          enabled: channel === 'email' || channel === 'in_app',
          digestEnabled: false,
          digestFrequency: 'daily',
          quietHoursStart: null,
          quietHoursEnd: null,
          categories: Object.fromEntries(NOTIFICATION_CATEGORIES.map(c => [c, true])),
        };
      });

      res.json({ preferences: result, availableChannels: NOTIFICATION_CHANNELS, availableCategories: NOTIFICATION_CATEGORIES });
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.patch('/api/notifications/preferences/:channel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { channel } = req.params;

      if (!NOTIFICATION_CHANNELS.includes(channel as any)) {
        return res.status(400).json({ message: "Invalid channel" });
      }

      const updateSchema = z.object({
        enabled: z.boolean().optional(),
        digestEnabled: z.boolean().optional(),
        digestFrequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
        quietHoursStart: z.string().nullable().optional(),
        quietHoursEnd: z.string().nullable().optional(),
        categories: z.record(z.boolean()).optional(),
      });

      const data = updateSchema.parse(req.body);
      const pref = await storage.upsertNotificationPreference(userId, channel, data);

      res.json(pref);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  app.post('/api/notifications/preferences/bulk', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const bulkSchema = z.object({
        preferences: z.array(z.object({
          channel: z.enum(['email', 'in_app', 'slack']),
          enabled: z.boolean().optional(),
          digestEnabled: z.boolean().optional(),
          digestFrequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
          quietHoursStart: z.string().nullable().optional(),
          quietHoursEnd: z.string().nullable().optional(),
          categories: z.record(z.boolean()).optional(),
        })),
      });

      const { preferences } = bulkSchema.parse(req.body);
      const results = [];

      for (const pref of preferences) {
        const { channel, ...data } = pref;
        const updated = await storage.upsertNotificationPreference(userId, channel, data);
        results.push(updated);
      }

      res.json({ preferences: results });
    } catch (error) {
      console.error("Error bulk updating notification preferences:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  app.get('/api/analytics/job-metrics/:jobId', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const jobId = req.params.jobId;
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const dateRangeSchema = z.object({
        startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
      });
      
      const { startDate, endDate } = dateRangeSchema.parse(req.query);
      
      const metrics = await storage.getJobMetrics(user.tenantId, jobId, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid date parameters", errors: error.errors });
      }
      console.error("Error fetching job metrics:", error);
      res.status(500).json({ message: "Failed to fetch job metrics" });
    }
  });

  app.get('/api/analytics/candidate-funnel', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const funnelQuerySchema = z.object({
        jobId: z.string().optional(),
        startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
      });
      
      const { jobId, startDate, endDate } = funnelQuerySchema.parse(req.query);
      
      const snapshots = await storage.getCandidateFunnelSnapshots(user.tenantId, jobId, startDate, endDate);
      res.json(snapshots);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      console.error("Error fetching funnel snapshots:", error);
      res.status(500).json({ message: "Failed to fetch candidate funnel data" });
    }
  });

  app.get('/api/analytics/time-to-hire', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const timeToHireQuerySchema = z.object({
        jobId: z.string().optional(),
        startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
      });
      
      const { jobId, startDate, endDate } = timeToHireQuerySchema.parse(req.query);
      
      const records = await storage.getTimeToHireRecords(user.tenantId, jobId, startDate, endDate);
      res.json(records);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      console.error("Error fetching time-to-hire records:", error);
      res.status(500).json({ message: "Failed to fetch time-to-hire data" });
    }
  });

  app.get('/api/analytics/revenue', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const revenueQuerySchema = z.object({
        startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
        aggregated: z.coerce.boolean().optional().default(false)
      });
      
      const { startDate, endDate, aggregated } = revenueQuerySchema.parse(req.query);
      
      if (aggregated) {
        const aggregates = await storage.getRevenueAggregates(user.tenantId, startDate, endDate);
        res.json(aggregates);
      } else {
        const transactions = await storage.getRevenueTransactions(user.tenantId, startDate, endDate);
        res.json(transactions);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  app.post('/api/analytics/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const eventSchema = z.object({
        entityType: z.string(),
        entityId: z.string(),
        eventType: z.string(),
        payload: z.record(z.any()).optional()
      });
      
      const validatedData = eventSchema.parse(req.body);
      
      const event = await storage.trackAnalyticsEvent({
        ...validatedData,
        tenantId: user.tenantId,
        actorId: userId,
        occurredAt: new Date()
      });
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error tracking analytics event:", error);
      res.status(500).json({ message: "Failed to track analytics event" });
    }
  });

  // CSRF Token endpoint - GET for fetching token
  app.get('/api/csrf-token', (req, res) => {
    generateCsrfTokenRoute(req, res);
  });

  // GDPR endpoints
  app.get('/api/gdpr/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = await gdprService.exportUserData(userId, req);
      res.setHeader('Content-Disposition', 'attachment; filename=user-data.json');
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } catch (error) {
      console.error('GDPR export error:', error);
      res.status(500).json({ message: 'Failed to export data' });
    }
  });

  app.delete('/api/gdpr/delete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { confirm } = req.body;
      if (confirm !== true) {
        return res.status(400).json({ message: 'Deletion requires explicit confirmation' });
      }
      
      await gdprService.deleteUserData(userId, req);
      res.json({ message: 'Your data deletion request has been processed' });
    } catch (error) {
      console.error('GDPR delete error:', error);
      res.status(500).json({ message: 'Failed to delete data' });
    }
  });

  app.get('/api/gdpr/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await gdprService.getRightToBeForgotten(userId);
      res.json(status);
    } catch (error) {
      console.error('GDPR status error:', error);
      res.status(500).json({ message: 'Failed to get GDPR status' });
    }
  });

  // Audit log endpoints (admin only)
  app.get('/api/admin/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      res.json({
        message: 'Audit logging is enabled',
        note: 'Implement audit_logs table in database to persist logs'
      });
    } catch (error) {
      console.error('Audit log error:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Public Contact Form Endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      const contactSchema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        company: z.string().optional(),
        subject: z.string().min(5, "Subject must be at least 5 characters"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      });

      const validatedData = contactSchema.parse(req.body);

      const submission = await storage.createContactSubmission({
        ...validatedData,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        message: "Thank you for your message. We'll get back to you within 24 hours.",
        id: submission.id
      });
    } catch (error) {
      console.error("Contact form error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to submit contact form. Please try again later."
      });
    }
  });

  // Admin endpoint to view contact submissions
  app.get('/api/admin/contact-submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const status = req.query.status as string | undefined;
      const submissions = await storage.getContactSubmissions(status);
      res.json(submissions);
    } catch (error) {
      console.error('Contact submissions error:', error);
      res.status(500).json({ message: 'Failed to fetch contact submissions' });
    }
  });

  // Admin endpoint to update contact submission status
  app.patch('/api/admin/contact-submissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!['new', 'read', 'replied', 'archived'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const submission = await storage.updateContactSubmission(id, { status });
      res.json(submission);
    } catch (error) {
      console.error('Update contact submission error:', error);
      res.status(500).json({ message: 'Failed to update contact submission' });
    }
  });

  // ==================== EMAIL PREFERENCES ====================

  // Get email preferences for current user
  app.get('/api/email/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let prefs = await storage.getEmailPreferences(userId);

      // Create default preferences if none exist
      if (!prefs) {
        prefs = await storage.createEmailPreferences({ userId });
      }

      res.json(prefs);
    } catch (error) {
      console.error('Get email preferences error:', error);
      res.status(500).json({ message: 'Failed to get email preferences' });
    }
  });

  // Update email preferences
  app.patch('/api/email/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;

      // Ensure preferences exist first
      let prefs = await storage.getEmailPreferences(userId);
      if (!prefs) {
        prefs = await storage.createEmailPreferences({ userId });
      }

      const updated = await storage.updateEmailPreferences(userId, updates);
      res.json(updated);
    } catch (error) {
      console.error('Update email preferences error:', error);
      res.status(500).json({ message: 'Failed to update email preferences' });
    }
  });

  // One-click unsubscribe (no auth required - uses token)
  app.get('/api/email/unsubscribe/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { type } = req.query; // Optional: specific email type to unsubscribe from

      const prefs = await storage.getEmailPreferencesByToken(token);
      if (!prefs) {
        return res.status(404).json({ message: 'Invalid unsubscribe link' });
      }

      // Update preferences based on type
      if (type === 'all') {
        await storage.updateEmailPreferences(prefs.userId, { unsubscribedAll: true });
      } else if (type === 'digest') {
        await storage.updateEmailPreferences(prefs.userId, { weeklyDigest: false });
      } else if (type === 'marketing') {
        await storage.updateEmailPreferences(prefs.userId, { marketingEmails: false });
      } else if (type === 'matches') {
        await storage.updateEmailPreferences(prefs.userId, { newJobMatches: false });
      } else {
        // Default: unsubscribe from marketing emails
        await storage.updateEmailPreferences(prefs.userId, { marketingEmails: false });
      }

      // Return HTML page confirming unsubscribe
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribed - SkillSync AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
            .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; }
            h1 { color: #1f2937; margin-bottom: 16px; }
            p { color: #6b7280; line-height: 1.6; }
            a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Unsubscribed</h1>
            <p>You've been successfully unsubscribed${type ? ` from ${type} emails` : ''}.</p>
            <p>You can <a href="${process.env.VITE_API_URL || 'https://skillsync.ai'}/settings/notifications">manage your preferences</a> at any time.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).send('Failed to unsubscribe. Please try again or contact support.');
    }
  });

  // Re-subscribe (authenticated)
  app.post('/api/email/resubscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.updateEmailPreferences(userId, { unsubscribedAll: false });
      res.json({ success: true });
    } catch (error) {
      console.error('Resubscribe error:', error);
      res.status(500).json({ message: 'Failed to resubscribe' });
    }
  });

  // Get email logs for admin (admin only)
  app.get('/api/admin/email-logs', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, emailType, status, limit } = req.query;
      const logs = await storage.getEmailLogs({
        userId: userId as string,
        emailType: emailType as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : 100,
      });
      res.json(logs);
    } catch (error) {
      console.error('Get email logs error:', error);
      res.status(500).json({ message: 'Failed to get email logs' });
    }
  });

  // ==================== JOB QUEUE ADMIN ROUTES ====================

  // Get all queue statuses
  app.get('/api/admin/job-queues', isAuthenticated, async (req: any, res) => {
    try {
      const { getAllQueueStatuses, isRedisAvailable } = await import('./jobQueue');

      if (!isRedisAvailable()) {
        return res.json({
          available: false,
          message: 'Redis not connected. Job queues are unavailable.',
          queues: []
        });
      }

      const statuses = await getAllQueueStatuses();
      res.json({ available: true, queues: statuses });
    } catch (error) {
      console.error('Get queue statuses error:', error);
      res.status(500).json({ message: 'Failed to get queue statuses' });
    }
  });

  // Get recent jobs from a specific queue
  app.get('/api/admin/job-queues/:queueName/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const { queueName } = req.params;
      const { status = 'failed', limit = '20' } = req.query;

      const { getRecentJobs, isRedisAvailable } = await import('./jobQueue');

      if (!isRedisAvailable()) {
        return res.json({ available: false, jobs: [] });
      }

      const jobs = await getRecentJobs(
        queueName,
        status as 'completed' | 'failed' | 'delayed' | 'active' | 'waiting',
        parseInt(limit as string)
      );
      res.json({ available: true, jobs });
    } catch (error) {
      console.error('Get queue jobs error:', error);
      res.status(500).json({ message: 'Failed to get queue jobs' });
    }
  });

  // Retry a failed job
  app.post('/api/admin/job-queues/:queueName/jobs/:jobId/retry', isAuthenticated, async (req: any, res) => {
    try {
      const { queueName, jobId } = req.params;

      const { retryJob, isRedisAvailable } = await import('./jobQueue');

      if (!isRedisAvailable()) {
        return res.status(503).json({ message: 'Redis not available' });
      }

      const success = await retryJob(queueName, jobId);
      if (success) {
        res.json({ message: 'Job queued for retry' });
      } else {
        res.status(404).json({ message: 'Job not found' });
      }
    } catch (error) {
      console.error('Retry job error:', error);
      res.status(500).json({ message: 'Failed to retry job' });
    }
  });

  // Remove a job
  app.delete('/api/admin/job-queues/:queueName/jobs/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const { queueName, jobId } = req.params;

      const { removeJob, isRedisAvailable } = await import('./jobQueue');

      if (!isRedisAvailable()) {
        return res.status(503).json({ message: 'Redis not available' });
      }

      const success = await removeJob(queueName, jobId);
      if (success) {
        res.json({ message: 'Job removed' });
      } else {
        res.status(404).json({ message: 'Job not found' });
      }
    } catch (error) {
      console.error('Remove job error:', error);
      res.status(500).json({ message: 'Failed to remove job' });
    }
  });

  // Pause/Resume a queue
  app.post('/api/admin/job-queues/:queueName/pause', isAuthenticated, async (req: any, res) => {
    try {
      const { queueName } = req.params;

      const { pauseQueue, isRedisAvailable } = await import('./jobQueue');

      if (!isRedisAvailable()) {
        return res.status(503).json({ message: 'Redis not available' });
      }

      await pauseQueue(queueName);
      res.json({ message: `Queue ${queueName} paused` });
    } catch (error) {
      console.error('Pause queue error:', error);
      res.status(500).json({ message: 'Failed to pause queue' });
    }
  });

  app.post('/api/admin/job-queues/:queueName/resume', isAuthenticated, async (req: any, res) => {
    try {
      const { queueName } = req.params;

      const { resumeQueue, isRedisAvailable } = await import('./jobQueue');

      if (!isRedisAvailable()) {
        return res.status(503).json({ message: 'Redis not available' });
      }

      await resumeQueue(queueName);
      res.json({ message: `Queue ${queueName} resumed` });
    } catch (error) {
      console.error('Resume queue error:', error);
      res.status(500).json({ message: 'Failed to resume queue' });
    }
  });

  // Clean old jobs from a queue
  app.post('/api/admin/job-queues/:queueName/clean', isAuthenticated, async (req: any, res) => {
    try {
      const { queueName } = req.params;
      const { gracePeriod = 86400000 } = req.body; // Default 24 hours

      const { cleanQueue, isRedisAvailable } = await import('./jobQueue');

      if (!isRedisAvailable()) {
        return res.status(503).json({ message: 'Redis not available' });
      }

      await cleanQueue(queueName, gracePeriod);
      res.json({ message: `Queue ${queueName} cleaned` });
    } catch (error) {
      console.error('Clean queue error:', error);
      res.status(500).json({ message: 'Failed to clean queue' });
    }
  });

  // ===============================
  // WEBHOOK MANAGEMENT ROUTES
  // ===============================

  const WEBHOOK_EVENTS = [
    'application.created',
    'application.updated',
    'application.status_changed',
    'job.created',
    'job.updated',
    'job.closed',
    'match.created',
    'match.updated',
    'interview.scheduled',
    'interview.completed',
    'candidate.hired',
    'candidate.rejected',
  ];

  // Get all webhook subscriptions for tenant
  app.get('/api/webhooks', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    try {
      const subscriptions = await storage.getWebhookSubscriptions(user.tenantId);
      res.json({ subscriptions, availableEvents: WEBHOOK_EVENTS });
    } catch (error) {
      console.error('Get webhooks error:', error);
      res.status(500).json({ message: 'Failed to get webhooks' });
    }
  });

  // Create webhook subscription
  app.post('/api/webhooks', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    const { endpointUrl, subscribedEvents, description } = req.body;

    if (!endpointUrl || !subscribedEvents || !Array.isArray(subscribedEvents)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate events
    const invalidEvents = subscribedEvents.filter((e: string) => !WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ message: `Invalid events: ${invalidEvents.join(', ')}` });
    }

    try {
      // Generate secret for HMAC signature
      const crypto = await import('crypto');
      const secret = crypto.randomBytes(32).toString('hex');

      const subscription = await storage.createWebhookSubscription({
        tenantId: user.tenantId,
        endpointUrl,
        secret,
        subscribedEvents,
        metadata: description ? { description } : undefined,
        isEnabled: true,
      });

      res.status(201).json({ subscription, secret });
    } catch (error) {
      console.error('Create webhook error:', error);
      res.status(500).json({ message: 'Failed to create webhook' });
    }
  });

  // Get single webhook subscription
  app.get('/api/webhooks/:id', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    try {
      const subscription = await storage.getWebhookSubscriptionById(req.params.id);
      if (!subscription || subscription.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      const attempts = await storage.getWebhookDeliveryAttempts(subscription.id, 20);
      res.json({ subscription, attempts });
    } catch (error) {
      console.error('Get webhook error:', error);
      res.status(500).json({ message: 'Failed to get webhook' });
    }
  });

  // Update webhook subscription
  app.patch('/api/webhooks/:id', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    try {
      const subscription = await storage.getWebhookSubscriptionById(req.params.id);
      if (!subscription || subscription.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      const { endpointUrl, subscribedEvents, description, isEnabled } = req.body;
      const updateData: any = {};

      if (endpointUrl) updateData.endpointUrl = endpointUrl;
      if (subscribedEvents) {
        const invalidEvents = subscribedEvents.filter((e: string) => !WEBHOOK_EVENTS.includes(e));
        if (invalidEvents.length > 0) {
          return res.status(400).json({ message: `Invalid events: ${invalidEvents.join(', ')}` });
        }
        updateData.subscribedEvents = subscribedEvents;
      }
      if (description !== undefined) updateData.metadata = { description };
      if (typeof isEnabled === 'boolean') updateData.isEnabled = isEnabled;

      const updated = await storage.updateWebhookSubscription(req.params.id, updateData);
      res.json({ subscription: updated });
    } catch (error) {
      console.error('Update webhook error:', error);
      res.status(500).json({ message: 'Failed to update webhook' });
    }
  });

  // Regenerate webhook secret
  app.post('/api/webhooks/:id/regenerate-secret', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    try {
      const subscription = await storage.getWebhookSubscriptionById(req.params.id);
      if (!subscription || subscription.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      const crypto = await import('crypto');
      const newSecret = crypto.randomBytes(32).toString('hex');

      await storage.updateWebhookSubscription(req.params.id, { secret: newSecret });
      res.json({ secret: newSecret });
    } catch (error) {
      console.error('Regenerate secret error:', error);
      res.status(500).json({ message: 'Failed to regenerate secret' });
    }
  });

  // Delete webhook subscription
  app.delete('/api/webhooks/:id', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    try {
      const subscription = await storage.getWebhookSubscriptionById(req.params.id);
      if (!subscription || subscription.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      await storage.deleteWebhookSubscription(req.params.id);
      res.json({ message: 'Webhook deleted' });
    } catch (error) {
      console.error('Delete webhook error:', error);
      res.status(500).json({ message: 'Failed to delete webhook' });
    }
  });

  // Test webhook endpoint
  app.post('/api/webhooks/:id/test', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    try {
      const subscription = await storage.getWebhookSubscriptionById(req.params.id);
      if (!subscription || subscription.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook delivery',
          subscriptionId: subscription.id,
        },
      };

      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', subscription.secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');

      const response = await fetch(subscription.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': 'test',
          'X-Webhook-Timestamp': testPayload.timestamp,
        },
        body: JSON.stringify(testPayload),
      });

      const status = response.ok ? 'success' : 'failed';
      const responseText = await response.text().catch(() => '');

      // Log the attempt
      await storage.createWebhookDeliveryAttempt({
        subscriptionId: subscription.id,
        eventType: 'test',
        payload: testPayload,
        status,
        attempts: 1,
        responseCode: response.status,
        responseBody: responseText.slice(0, 1000),
        deliveredAt: response.ok ? new Date() : undefined,
      });

      if (response.ok) {
        await storage.updateWebhookSubscription(subscription.id, { lastSuccessAt: new Date() });
      }

      res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText.slice(0, 500),
      });
    } catch (error: any) {
      console.error('Test webhook error:', error);
      res.json({
        success: false,
        error: error.message || 'Failed to deliver webhook',
      });
    }
  });

  // Get webhook delivery logs
  app.get('/api/webhooks/:id/logs', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(403).json({ message: 'No tenant associated' });
    }

    try {
      const subscription = await storage.getWebhookSubscriptionById(req.params.id);
      if (!subscription || subscription.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const attempts = await storage.getWebhookDeliveryAttempts(subscription.id, limit);
      res.json({ attempts });
    } catch (error) {
      console.error('Get webhook logs error:', error);
      res.status(500).json({ message: 'Failed to get webhook logs' });
    }
  });

  // ============================================
  // Advanced Team Permissions API (Phase 3.4)
  // ============================================

  // Get all available permissions (for UI display)
  app.get('/api/permissions', isAuthenticated, async (req: any, res) => {
    try {
      res.json({
        permissions: schema.PERMISSIONS,
        groups: schema.PERMISSION_GROUPS,
        systemRoles: Object.entries(schema.SYSTEM_ROLES).map(([key, config]) => ({
          key,
          ...config,
        })),
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({ message: 'Failed to get permissions' });
    }
  });

  // Get user's permission context
  app.get('/api/permissions/my-context', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.json({ hasTeamRole: false, permissions: [] });
      }

      const context = await permissionService.getPermissionContext(userId, user.tenantId);
      if (!context) {
        return res.json({ hasTeamRole: false, permissions: [] });
      }

      res.json({
        hasTeamRole: true,
        ...context,
      });
    } catch (error) {
      console.error('Get permission context error:', error);
      res.status(500).json({ message: 'Failed to get permission context' });
    }
  });

  // ============================================
  // Team Roles API
  // ============================================

  // Get all team roles for tenant
  app.get('/api/employer/team/roles', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const roles = await permissionService.getTeamRoles(user.tenantId);
      res.json(roles);
    } catch (error) {
      console.error('Get team roles error:', error);
      res.status(500).json({ message: 'Failed to get team roles' });
    }
  });

  // Initialize system roles for tenant (called automatically or manually)
  app.post('/api/employer/team/roles/initialize', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const roles = await permissionService.initializeSystemRoles(user.tenantId, userId);
      res.json({ message: 'System roles initialized', roles });
    } catch (error) {
      console.error('Initialize system roles error:', error);
      res.status(500).json({ message: 'Failed to initialize system roles' });
    }
  });

  // Create a custom team role
  app.post('/api/employer/team/roles', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      // Check if user has permission to manage roles
      const hasPermission = await permissionService.hasPermission(userId, user.tenantId, 'team.roles');
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied: team.roles required' });
      }

      const { name, description, permissions } = req.body;

      if (!name || !Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Name and permissions array required' });
      }

      // Validate permissions
      const validPermissions = permissions.filter(p => p in schema.PERMISSIONS);

      const role = await permissionService.createTeamRole({
        tenantId: user.tenantId,
        name,
        description,
        permissions: validPermissions,
        isSystemRole: false,
        createdBy: userId,
      });

      // Log the permission change
      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId: userId,
        action: 'role.create',
        entityType: 'team_role',
        entityId: role.id,
        newValue: { name, permissions: validPermissions },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json(role);
    } catch (error) {
      console.error('Create team role error:', error);
      res.status(500).json({ message: 'Failed to create team role' });
    }
  });

  // Update a custom team role
  app.patch('/api/employer/team/roles/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const roleId = req.params.id;

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      // Check permission
      const hasPermission = await permissionService.hasPermission(userId, user.tenantId, 'team.roles');
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const existingRole = await permissionService.getTeamRoleById(roleId);
      if (!existingRole || existingRole.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Role not found' });
      }

      if (existingRole.isSystemRole) {
        return res.status(403).json({ message: 'Cannot modify system roles' });
      }

      const { name, description, permissions } = req.body;
      const updates: Partial<schema.InsertTeamRole> = {};

      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (Array.isArray(permissions)) {
        updates.permissions = permissions.filter(p => p in schema.PERMISSIONS);
      }

      const updatedRole = await permissionService.updateTeamRole(roleId, updates);

      // Log the change
      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId: userId,
        action: 'role.update',
        entityType: 'team_role',
        entityId: roleId,
        oldValue: { name: existingRole.name, permissions: existingRole.permissions },
        newValue: updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json(updatedRole);
    } catch (error) {
      console.error('Update team role error:', error);
      res.status(500).json({ message: 'Failed to update team role' });
    }
  });

  // Delete a custom team role
  app.delete('/api/employer/team/roles/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const roleId = req.params.id;

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const hasPermission = await permissionService.hasPermission(userId, user.tenantId, 'team.roles');
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const existingRole = await permissionService.getTeamRoleById(roleId);
      if (!existingRole || existingRole.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Role not found' });
      }

      if (existingRole.isSystemRole) {
        return res.status(403).json({ message: 'Cannot delete system roles' });
      }

      await permissionService.deleteTeamRole(roleId);

      // Log the deletion
      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId: userId,
        action: 'role.delete',
        entityType: 'team_role',
        entityId: roleId,
        oldValue: { name: existingRole.name, permissions: existingRole.permissions },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Role deleted' });
    } catch (error) {
      console.error('Delete team role error:', error);
      res.status(500).json({ message: 'Failed to delete team role' });
    }
  });

  // ============================================
  // Department API
  // ============================================

  // Get all departments for tenant
  app.get('/api/employer/departments', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const departments = await permissionService.getDepartments(user.tenantId);
      res.json(departments);
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({ message: 'Failed to get departments' });
    }
  });

  // Create a department
  app.post('/api/employer/departments', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const hasPermission = await permissionService.hasAnyPermission(userId, user.tenantId, ['settings.edit', 'team.roles']);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const { name, description, parentId, managerId } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Department name required' });
      }

      const department = await permissionService.createDepartment({
        tenantId: user.tenantId,
        name,
        description,
        parentId,
        managerId,
      });

      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId: userId,
        action: 'department.create',
        entityType: 'department',
        entityId: department.id,
        newValue: { name, description, parentId, managerId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json(department);
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({ message: 'Failed to create department' });
    }
  });

  // Update a department
  app.patch('/api/employer/departments/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const deptId = req.params.id;

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const hasPermission = await permissionService.hasAnyPermission(userId, user.tenantId, ['settings.edit', 'team.roles']);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const existingDept = await permissionService.getDepartmentById(deptId);
      if (!existingDept || existingDept.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Department not found' });
      }

      const { name, description, parentId, managerId } = req.body;
      const updates: Partial<schema.InsertDepartment> = {};

      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (parentId !== undefined) updates.parentId = parentId;
      if (managerId !== undefined) updates.managerId = managerId;

      const updatedDept = await permissionService.updateDepartment(deptId, updates);

      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId: userId,
        action: 'department.update',
        entityType: 'department',
        entityId: deptId,
        oldValue: { name: existingDept.name, description: existingDept.description },
        newValue: updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json(updatedDept);
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({ message: 'Failed to update department' });
    }
  });

  // Delete a department
  app.delete('/api/employer/departments/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const deptId = req.params.id;

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const hasPermission = await permissionService.hasAnyPermission(userId, user.tenantId, ['settings.edit', 'team.roles']);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const existingDept = await permissionService.getDepartmentById(deptId);
      if (!existingDept || existingDept.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Department not found' });
      }

      await permissionService.deleteDepartment(deptId);

      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId: userId,
        action: 'department.delete',
        entityType: 'department',
        entityId: deptId,
        oldValue: { name: existingDept.name },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Department deleted' });
    } catch (error) {
      console.error('Delete department error:', error);
      res.status(500).json({ message: 'Failed to delete department' });
    }
  });

  // ============================================
  // Team Member Role Assignments API
  // ============================================

  // Get all team member role assignments
  app.get('/api/employer/team/member-roles', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const memberRoles = await permissionService.getTeamMemberRoles(user.tenantId);
      res.json(memberRoles);
    } catch (error) {
      console.error('Get team member roles error:', error);
      res.status(500).json({ message: 'Failed to get team member roles' });
    }
  });

  // Assign a role to a team member
  app.post('/api/employer/team/member-roles', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const hasPermission = await permissionService.hasPermission(userId, user.tenantId, 'team.permissions');
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied: team.permissions required' });
      }

      const { targetUserId, teamRoleId, departmentId } = req.body;

      if (!targetUserId || !teamRoleId) {
        return res.status(400).json({ message: 'targetUserId and teamRoleId required' });
      }

      // Verify role exists and belongs to tenant
      const role = await permissionService.getTeamRoleById(teamRoleId);
      if (!role || role.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Verify target user exists and belongs to tenant
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser || targetUser.tenantId !== user.tenantId) {
        return res.status(404).json({ message: 'User not found in team' });
      }

      // Get existing assignment for audit log
      const existingAssignment = await permissionService.getTeamMemberRole(targetUserId, user.tenantId);

      const memberRole = await permissionService.assignTeamRole({
        userId: targetUserId,
        tenantId: user.tenantId,
        teamRoleId,
        departmentId,
        assignedBy: userId,
      });

      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId: userId,
        targetUserId,
        action: existingAssignment ? 'member.update_role' : 'member.assign_role',
        entityType: 'team_member_role',
        entityId: memberRole.id,
        oldValue: existingAssignment ? { roleId: existingAssignment.teamRoleId } : undefined,
        newValue: { roleId: teamRoleId, departmentId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json(memberRole);
    } catch (error) {
      console.error('Assign team role error:', error);
      res.status(500).json({ message: 'Failed to assign team role' });
    }
  });

  // Remove a role from a team member
  app.delete('/api/employer/team/member-roles/:userId', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const actorId = req.user.claims.sub;
      const user = await storage.getUser(actorId);
      const targetUserId = req.params.userId;

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const hasPermission = await permissionService.hasPermission(actorId, user.tenantId, 'team.permissions');
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const existingAssignment = await permissionService.getTeamMemberRole(targetUserId, user.tenantId);
      if (!existingAssignment) {
        return res.status(404).json({ message: 'Member role assignment not found' });
      }

      await permissionService.removeTeamMemberRole(targetUserId, user.tenantId);

      await permissionService.logPermissionChange({
        tenantId: user.tenantId,
        actorId,
        targetUserId,
        action: 'member.remove_role',
        entityType: 'team_member_role',
        entityId: existingAssignment.id,
        oldValue: { roleId: existingAssignment.teamRoleId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Role removed from member' });
    } catch (error) {
      console.error('Remove team role error:', error);
      res.status(500).json({ message: 'Failed to remove team role' });
    }
  });

  // ============================================
  // Permission Audit Log API
  // ============================================

  app.get('/api/employer/team/audit-logs', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const hasPermission = await permissionService.hasAnyPermission(userId, user.tenantId, ['team.roles', 'team.permissions']);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const { actorId, targetUserId, action, limit, offset } = req.query;

      const logs = await permissionService.getPermissionAuditLogs(user.tenantId, {
        actorId: actorId as string,
        targetUserId: targetUserId as string,
        action: action as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(logs);
    } catch (error) {
      console.error('Get permission audit logs error:', error);
      res.status(500).json({ message: 'Failed to get audit logs' });
    }
  });

  // ============================================
  // API Rate Limiting & Monetization (Phase 3.5)
  // ============================================

  // Import rate limit service
  const { rateLimitService } = await import('./rateLimitService');

  // Get subscription tiers configuration
  app.get('/api/subscription/tiers', async (req: any, res) => {
    try {
      res.json({
        tiers: schema.SUBSCRIPTION_TIERS,
        scopes: schema.API_KEY_SCOPES,
      });
    } catch (error) {
      console.error('Get subscription tiers error:', error);
      res.status(500).json({ message: 'Failed to get subscription tiers' });
    }
  });

  // Get current tenant subscription
  app.get('/api/subscription', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const subscription = await rateLimitService.getTenantSubscription(user.tenantId);
      const limits = await rateLimitService.getRateLimits(user.tenantId);

      const tier = (subscription?.tier || 'free') as schema.SubscriptionTierKey;
      const tierConfig = schema.SUBSCRIPTION_TIERS[tier];

      res.json({
        subscription: subscription || { tier: 'free', status: 'active' },
        tierConfig,
        rateLimits: limits,
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ message: 'Failed to get subscription' });
    }
  });

  // Get API usage statistics
  app.get('/api/usage/stats', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const stats = await rateLimitService.getUsageStats(user.tenantId, days);

      res.json(stats);
    } catch (error) {
      console.error('Get usage stats error:', error);
      res.status(500).json({ message: 'Failed to get usage stats' });
    }
  });

  // ============================================
  // API Keys Management
  // ============================================

  // List API keys for tenant
  app.get('/api/keys', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const keys = await db
        .select({
          id: schema.apiKeys.id,
          name: schema.apiKeys.name,
          keyPrefix: schema.apiKeys.keyPrefix,
          lastFour: schema.apiKeys.lastFour,
          scopes: schema.apiKeys.scopes,
          environment: schema.apiKeys.environment,
          expiresAt: schema.apiKeys.expiresAt,
          lastUsedAt: schema.apiKeys.lastUsedAt,
          isActive: schema.apiKeys.isActive,
          createdAt: schema.apiKeys.createdAt,
        })
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.tenantId, user.tenantId))
        .orderBy(schema.apiKeys.createdAt);

      res.json(keys);
    } catch (error) {
      console.error('List API keys error:', error);
      res.status(500).json({ message: 'Failed to list API keys' });
    }
  });

  // Create new API key
  app.post('/api/keys', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      // Check if tenant has reached API key limit
      const subscription = await rateLimitService.getTenantSubscription(user.tenantId);
      const tier = (subscription?.tier || 'free') as schema.SubscriptionTierKey;
      const tierConfig = schema.SUBSCRIPTION_TIERS[tier];

      const existingKeys = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.apiKeys)
        .where(and(
          eq(schema.apiKeys.tenantId, user.tenantId),
          eq(schema.apiKeys.isActive, true)
        ));

      if (existingKeys[0].count >= tierConfig.features.maxApiKeys) {
        return res.status(403).json({
          message: `API key limit reached. Your ${tierConfig.name} plan allows ${tierConfig.features.maxApiKeys} active keys.`
        });
      }

      const { name, scopes = [], environment = 'live', expiresInDays } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'API key name required' });
      }

      // Validate scopes
      const validScopes = (scopes as string[]).filter(s => s in schema.API_KEY_SCOPES);

      // Generate key
      const keyData = rateLimitService.generateApiKey(environment as 'live' | 'test');
      const keyHash = rateLimitService.hashApiKey(keyData.fullKey);

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const [newKey] = await db
        .insert(schema.apiKeys)
        .values({
          tenantId: user.tenantId,
          userId,
          name,
          keyPrefix: keyData.prefix,
          keyHash,
          lastFour: keyData.lastFour,
          scopes: validScopes,
          environment,
          expiresAt,
        })
        .returning();

      // Return the full key only once (it won't be retrievable again)
      res.status(201).json({
        id: newKey.id,
        name: newKey.name,
        key: keyData.fullKey, // Only returned on creation!
        keyPrefix: newKey.keyPrefix,
        lastFour: newKey.lastFour,
        scopes: newKey.scopes,
        environment: newKey.environment,
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
        warning: 'Save this API key now. You will not be able to see it again.',
      });
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });

  // Revoke API key
  app.delete('/api/keys/:id', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const keyId = req.params.id;

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      const { reason } = req.body;

      // Verify key belongs to tenant
      const [existingKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(and(
          eq(schema.apiKeys.id, keyId),
          eq(schema.apiKeys.tenantId, user.tenantId)
        ))
        .limit(1);

      if (!existingKey) {
        return res.status(404).json({ message: 'API key not found' });
      }

      await db
        .update(schema.apiKeys)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedBy: userId,
          revokedReason: reason || 'Manually revoked',
        })
        .where(eq(schema.apiKeys.id, keyId));

      res.json({ message: 'API key revoked' });
    } catch (error) {
      console.error('Revoke API key error:', error);
      res.status(500).json({ message: 'Failed to revoke API key' });
    }
  });

  // Rotate API key (create new, revoke old)
  app.post('/api/keys/:id/rotate', isAuthenticated, require2FA, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const keyId = req.params.id;

      if (!user?.tenantId) {
        return res.status(404).json({ message: 'No team found' });
      }

      // Get existing key
      const [existingKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(and(
          eq(schema.apiKeys.id, keyId),
          eq(schema.apiKeys.tenantId, user.tenantId),
          eq(schema.apiKeys.isActive, true)
        ))
        .limit(1);

      if (!existingKey) {
        return res.status(404).json({ message: 'API key not found or already revoked' });
      }

      // Generate new key
      const keyData = rateLimitService.generateApiKey(existingKey.environment as 'live' | 'test');
      const keyHash = rateLimitService.hashApiKey(keyData.fullKey);

      // Create new key with same settings
      const [newKey] = await db
        .insert(schema.apiKeys)
        .values({
          tenantId: user.tenantId,
          userId,
          name: `${existingKey.name} (rotated)`,
          keyPrefix: keyData.prefix,
          keyHash,
          lastFour: keyData.lastFour,
          scopes: existingKey.scopes,
          environment: existingKey.environment,
          expiresAt: existingKey.expiresAt,
        })
        .returning();

      // Revoke old key
      await db
        .update(schema.apiKeys)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedBy: userId,
          revokedReason: 'Key rotated',
        })
        .where(eq(schema.apiKeys.id, keyId));

      res.status(201).json({
        id: newKey.id,
        name: newKey.name,
        key: keyData.fullKey,
        keyPrefix: newKey.keyPrefix,
        lastFour: newKey.lastFour,
        scopes: newKey.scopes,
        environment: newKey.environment,
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
        previousKeyId: keyId,
        warning: 'Save this API key now. You will not be able to see it again.',
      });
    } catch (error) {
      console.error('Rotate API key error:', error);
      res.status(500).json({ message: 'Failed to rotate API key' });
    }
  });

  return createServer(app);
}
