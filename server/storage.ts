import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  getAllUsers(): Promise<schema.User[]>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  upsertUser(user: schema.UpsertUser): Promise<schema.User>;
  
  getJobSeeker(userId: string): Promise<schema.JobSeeker | undefined>;
  getJobSeekerById(id: string): Promise<schema.JobSeeker | undefined>;
  createJobSeeker(jobSeeker: schema.InsertJobSeeker): Promise<schema.JobSeeker>;
  updateJobSeeker(id: string, data: Partial<schema.InsertJobSeeker>): Promise<schema.JobSeeker>;
  
  getEmployer(userId: string): Promise<schema.Employer | undefined>;
  getEmployerById(id: string): Promise<schema.Employer | undefined>;
  createEmployer(employer: schema.InsertEmployer): Promise<schema.Employer>;
  updateEmployer(id: string, data: Partial<schema.InsertEmployer>): Promise<schema.Employer>;
  
  getJobs(employerId?: string): Promise<schema.Job[]>;
  getJobById(id: string): Promise<schema.Job | undefined>;
  createJob(job: schema.InsertJob): Promise<schema.Job>;
  updateJob(id: string, data: Partial<schema.InsertJob>): Promise<schema.Job>;
  
  getApplications(jobSeekerId?: string, jobId?: string): Promise<schema.Application[]>;
  getAllApplications(): Promise<schema.Application[]>;
  createApplication(application: schema.InsertApplication): Promise<schema.Application>;
  updateApplication(id: string, data: Partial<schema.InsertApplication>): Promise<schema.Application>;
  
  getMatches(jobSeekerId?: string, jobId?: string): Promise<schema.Match[]>;
  createMatch(match: schema.InsertMatch): Promise<schema.Match>;
  updateMatch(id: string, data: Partial<schema.InsertMatch>): Promise<schema.Match>;
  
  getLearningPlan(jobSeekerId: string): Promise<schema.LearningPlan | undefined>;
  createLearningPlan(plan: schema.InsertLearningPlan): Promise<schema.LearningPlan>;
  updateLearningPlan(id: string, data: Partial<schema.InsertLearningPlan>): Promise<schema.LearningPlan>;
  
  getTenant(id: string): Promise<schema.Tenant | undefined>;
  getTenants(): Promise<schema.Tenant[]>;
  createTenant(tenant: schema.InsertTenant): Promise<schema.Tenant>;
  updateTenant(id: string, data: Partial<schema.InsertTenant>): Promise<schema.Tenant>;
  
  getTeamInvitations(tenantId: string): Promise<schema.TeamInvitation[]>;
  getTeamInvitationByToken(token: string): Promise<schema.TeamInvitation | undefined>;
  createTeamInvitation(invitation: schema.InsertTeamInvitation): Promise<schema.TeamInvitation>;
  updateTeamInvitation(id: string, data: Partial<schema.InsertTeamInvitation>): Promise<schema.TeamInvitation>;
  getTeamMembers(tenantId: string): Promise<schema.User[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getAllUsers(): Promise<schema.User[]> {
    return db.select().from(schema.users);
  }

  async createUser(insertUser: schema.InsertUser): Promise<schema.User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: schema.UpsertUser): Promise<schema.User> {
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getJobSeeker(userId: string): Promise<schema.JobSeeker | undefined> {
    const [jobSeeker] = await db.select().from(schema.jobSeekers).where(eq(schema.jobSeekers.userId, userId));
    return jobSeeker;
  }

  async getJobSeekerById(id: string): Promise<schema.JobSeeker | undefined> {
    const [jobSeeker] = await db.select().from(schema.jobSeekers).where(eq(schema.jobSeekers.id, id));
    return jobSeeker;
  }

  async createJobSeeker(insertJobSeeker: schema.InsertJobSeeker): Promise<schema.JobSeeker> {
    const [jobSeeker] = await db.insert(schema.jobSeekers).values(insertJobSeeker).returning();
    return jobSeeker;
  }

  async updateJobSeeker(id: string, data: Partial<schema.InsertJobSeeker>): Promise<schema.JobSeeker> {
    const [jobSeeker] = await db.update(schema.jobSeekers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.jobSeekers.id, id))
      .returning();
    return jobSeeker;
  }

  async getEmployer(userId: string): Promise<schema.Employer | undefined> {
    const [employer] = await db.select().from(schema.employers).where(eq(schema.employers.userId, userId));
    return employer;
  }

  async getEmployerById(id: string): Promise<schema.Employer | undefined> {
    const [employer] = await db.select().from(schema.employers).where(eq(schema.employers.id, id));
    return employer;
  }

  async createEmployer(insertEmployer: schema.InsertEmployer): Promise<schema.Employer> {
    const [employer] = await db.insert(schema.employers).values(insertEmployer).returning();
    return employer;
  }

  async updateEmployer(id: string, data: Partial<schema.InsertEmployer>): Promise<schema.Employer> {
    const [employer] = await db.update(schema.employers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.employers.id, id))
      .returning();
    return employer;
  }

  async getJobs(employerId?: string): Promise<schema.Job[]> {
    if (employerId) {
      return db.select().from(schema.jobs).where(eq(schema.jobs.employerId, employerId));
    }
    return db.select().from(schema.jobs);
  }

  async getJobById(id: string): Promise<schema.Job | undefined> {
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));
    return job;
  }

  async createJob(insertJob: schema.InsertJob): Promise<schema.Job> {
    const [job] = await db.insert(schema.jobs).values(insertJob).returning();
    return job;
  }

  async updateJob(id: string, data: Partial<schema.InsertJob>): Promise<schema.Job> {
    const [job] = await db.update(schema.jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.jobs.id, id))
      .returning();
    return job;
  }

  async getApplications(jobSeekerId?: string, jobId?: string): Promise<schema.Application[]> {
    let query = db.select().from(schema.applications);
    
    if (jobSeekerId) {
      return query.where(eq(schema.applications.jobSeekerId, jobSeekerId));
    }
    if (jobId) {
      return query.where(eq(schema.applications.jobId, jobId));
    }
    
    return query;
  }

  async getAllApplications(): Promise<schema.Application[]> {
    return db.select().from(schema.applications);
  }

  async createApplication(insertApplication: schema.InsertApplication): Promise<schema.Application> {
    const [application] = await db.insert(schema.applications).values(insertApplication as any).returning();
    return application;
  }

  async updateApplication(id: string, data: Partial<schema.InsertApplication>): Promise<schema.Application> {
    const [application] = await db.update(schema.applications)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(schema.applications.id, id))
      .returning();
    return application;
  }

  async getMatches(jobSeekerId?: string, jobId?: string): Promise<schema.Match[]> {
    let query = db.select().from(schema.matches);
    
    if (jobSeekerId) {
      return query.where(eq(schema.matches.jobSeekerId, jobSeekerId));
    }
    if (jobId) {
      return query.where(eq(schema.matches.jobId, jobId));
    }
    
    return query;
  }

  async createMatch(insertMatch: schema.InsertMatch): Promise<schema.Match> {
    const [match] = await db.insert(schema.matches).values(insertMatch).returning();
    return match;
  }

  async updateMatch(id: string, data: Partial<schema.InsertMatch>): Promise<schema.Match> {
    const [match] = await db.update(schema.matches)
      .set(data)
      .where(eq(schema.matches.id, id))
      .returning();
    return match;
  }

  async getLearningPlan(jobSeekerId: string): Promise<schema.LearningPlan | undefined> {
    const [plan] = await db.select().from(schema.learningPlans).where(eq(schema.learningPlans.jobSeekerId, jobSeekerId));
    return plan;
  }

  async createLearningPlan(insertPlan: schema.InsertLearningPlan): Promise<schema.LearningPlan> {
    const [plan] = await db.insert(schema.learningPlans).values(insertPlan as any).returning();
    return plan;
  }

  async updateLearningPlan(id: string, data: Partial<schema.InsertLearningPlan>): Promise<schema.LearningPlan> {
    const [plan] = await db.update(schema.learningPlans)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(schema.learningPlans.id, id))
      .returning();
    return plan;
  }

  async getTenant(id: string): Promise<schema.Tenant | undefined> {
    const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id));
    return tenant;
  }

  async getTenants(): Promise<schema.Tenant[]> {
    return db.select().from(schema.tenants);
  }

  async createTenant(insertTenant: schema.InsertTenant): Promise<schema.Tenant> {
    const [tenant] = await db.insert(schema.tenants).values(insertTenant).returning();
    return tenant;
  }

  async updateTenant(id: string, data: Partial<schema.InsertTenant>): Promise<schema.Tenant> {
    const [tenant] = await db.update(schema.tenants)
      .set(data)
      .where(eq(schema.tenants.id, id))
      .returning();
    return tenant;
  }

  async getTeamInvitations(tenantId: string): Promise<schema.TeamInvitation[]> {
    return db.select().from(schema.teamInvitations).where(eq(schema.teamInvitations.tenantId, tenantId));
  }

  async getTeamInvitationByToken(token: string): Promise<schema.TeamInvitation | undefined> {
    const [invitation] = await db.select().from(schema.teamInvitations).where(eq(schema.teamInvitations.token, token));
    return invitation;
  }

  async createTeamInvitation(insertInvitation: schema.InsertTeamInvitation): Promise<schema.TeamInvitation> {
    const [invitation] = await db.insert(schema.teamInvitations).values(insertInvitation).returning();
    return invitation;
  }

  async updateTeamInvitation(id: string, data: Partial<schema.InsertTeamInvitation>): Promise<schema.TeamInvitation> {
    const [invitation] = await db.update(schema.teamInvitations)
      .set(data)
      .where(eq(schema.teamInvitations.id, id))
      .returning();
    return invitation;
  }

  async getTeamMembers(tenantId: string): Promise<schema.User[]> {
    return db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId));
  }
}

export const storage = new DbStorage();
