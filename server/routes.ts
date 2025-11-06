import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./aiService";
import { insertJobSeekerSchema, insertEmployerSchema, insertJobSchema, insertApplicationSchema, insertMatchSchema, insertLearningPlanSchema } from "@shared/schema";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

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

  app.patch('/api/employer/jobs/:id', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/tenants', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/employer/billing/status', isAuthenticated, async (req: any, res) => {
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
          return res.json({
            configured: true,
            hasSubscription: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end || 0,
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

  app.post('/api/employer/billing/create-checkout', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/employer/billing/create-portal', isAuthenticated, async (req: any, res) => {
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

  return createServer(app);
}
