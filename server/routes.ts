import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./aiService";
import { insertJobSeekerSchema, insertEmployerSchema, insertJobSchema, insertApplicationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

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
      const existing = await storage.getJobSeeker(userId);
      
      if (existing) {
        const updated = await storage.updateJobSeeker(existing.id, req.body);
        res.json(updated);
      } else {
        const created = await storage.createJobSeeker({ ...req.body, userId });
        res.json(created);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/job-seeker/extract-skills', isAuthenticated, async (req: any, res) => {
    try {
      const { resumeText } = req.body;
      const skills = await aiService.extractResumeSkills(resumeText);
      res.json({ skills });
    } catch (error) {
      res.status(500).json({ message: "Failed to extract skills" });
    }
  });

  app.get('/api/employer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      res.json(employer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/employer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await storage.getEmployer(userId);
      
      if (existing) {
        const updated = await storage.updateEmployer(existing.id, req.body);
        res.json(updated);
      } else {
        const created = await storage.createEmployer({ ...req.body, userId });
        res.json(created);
      }
    } catch (error) {
      console.error("Error updating employer profile:", error);
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

  app.get('/api/employer/jobs', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/employer/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employer = await storage.getEmployer(userId);
      
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const job = await storage.createJob({
        ...req.body,
        employerId: employer.id,
      });
      res.json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch('/api/employer/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updated = await storage.updateJob(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.post('/api/jobs/:jobId/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const application = await storage.createApplication({
        jobId: req.params.jobId,
        jobSeekerId: jobSeeker.id,
        coverLetter: req.body.coverLetter,
        timeline: [{
          stage: "Applied",
          status: "completed",
          date: new Date().toISOString(),
        }],
      });

      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
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

  app.get('/api/employer/applications', isAuthenticated, async (req: any, res) => {
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
      const updated = await storage.updateApplication(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.post('/api/job-seeker/find-matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobSeeker = await storage.getJobSeeker(userId);
      
      if (!jobSeeker) {
        return res.status(404).json({ message: "Job seeker profile not found" });
      }

      const jobs = await storage.getJobs();
      const matches = [];

      for (const job of jobs.slice(0, 10)) {
        const matchResult = await aiService.analyzeJobMatch(jobSeeker, job);
        
        if (matchResult.matchScore >= 50) {
          const match = await storage.createMatch({
            jobId: job.id,
            jobSeekerId: jobSeeker.id,
            matchScore: matchResult.matchScore,
            matchingSkills: matchResult.matchingSkills,
            gapSkills: matchResult.gapSkills,
            explanation: matchResult.explanation,
            aiMetadata: matchResult.aiMetadata,
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
      const updated = await storage.updateMatch(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
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
      const updated = await storage.updateLearningPlan(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update learning plan" });
    }
  });

  return createServer(app);
}
