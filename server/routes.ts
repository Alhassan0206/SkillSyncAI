import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  setupOAuth(app);

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
        
        if (tenantId) {
          await storage.updateTenant(tenantId, {
            stripeSubscriptionId: subscription.id,
            plan: subscription.status === 'active' ? 'pro' : 'free',
            status: subscription.status === 'active' ? 'active' : 'inactive',
          });
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
          });
        }
        break;
      }
    }

    res.json({ received: true });
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

  return createServer(app);
}
