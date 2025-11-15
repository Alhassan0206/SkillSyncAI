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
  searchJobs(filters: {
    skills?: string[];
    location?: string;
    minSalary?: number;
    maxSalary?: number;
    experienceLevel?: string;
    remote?: boolean;
  }): Promise<schema.Job[]>;
  
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
  
  createPasswordResetToken(token: schema.InsertPasswordResetToken): Promise<schema.PasswordResetToken>;
  getPasswordResetToken(userId: string, token: string): Promise<schema.PasswordResetToken | undefined>;
  deletePasswordResetToken(id: string): Promise<void>;
  deletePasswordResetTokensByUserId(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  getCandidateTags(jobSeekerId?: string, employerId?: string): Promise<schema.CandidateTag[]>;
  createCandidateTag(tag: schema.InsertCandidateTag): Promise<schema.CandidateTag>;
  deleteCandidateTag(id: string): Promise<void>;

  getCandidateNotes(jobSeekerId?: string, employerId?: string): Promise<schema.CandidateNote[]>;
  createCandidateNote(note: schema.InsertCandidateNote): Promise<schema.CandidateNote>;
  updateCandidateNote(id: string, data: Partial<schema.InsertCandidateNote>): Promise<schema.CandidateNote>;
  deleteCandidateNote(id: string): Promise<void>;

  getCandidateRatings(jobSeekerId?: string, employerId?: string): Promise<schema.CandidateRating[]>;
  createCandidateRating(rating: schema.InsertCandidateRating): Promise<schema.CandidateRating>;
  updateCandidateRating(id: string, data: Partial<schema.InsertCandidateRating>): Promise<schema.CandidateRating>;

  getGithubRepos(jobSeekerId: string): Promise<schema.GithubRepo[]>;
  createGithubRepo(repo: schema.InsertGithubRepo): Promise<schema.GithubRepo>;
  deleteGithubRepo(id: string): Promise<void>;

  getResumeParseQueue(jobSeekerId?: string): Promise<schema.ResumeParseQueue[]>;
  createResumeParseQueueItem(item: schema.InsertResumeParseQueue): Promise<schema.ResumeParseQueue>;
  updateResumeParseQueueItem(id: string, data: Partial<schema.InsertResumeParseQueue>): Promise<schema.ResumeParseQueue>;
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
    const [job] = await db.insert(schema.jobs).values(insertJob as any).returning();
    return job;
  }

  async updateJob(id: string, data: Partial<schema.InsertJob>): Promise<schema.Job> {
    const [job] = await db.update(schema.jobs)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(schema.jobs.id, id))
      .returning();
    return job;
  }

  async searchJobs(filters: {
    skills?: string[];
    location?: string;
    minSalary?: number;
    maxSalary?: number;
    experienceLevel?: string;
    remote?: boolean;
  }): Promise<schema.Job[]> {
    const { and, or, gte, lte, sql } = await import("drizzle-orm");
    
    const conditions = [];
    
    conditions.push(eq(schema.jobs.status, 'active'));
    
    if (filters.location) {
      conditions.push(eq(schema.jobs.location, filters.location));
    }
    
    if (filters.experienceLevel) {
      conditions.push(eq(schema.jobs.experienceLevel, filters.experienceLevel));
    }
    
    if (filters.remote !== undefined) {
      conditions.push(eq(schema.jobs.remote, filters.remote));
    }
    
    if (filters.minSalary) {
      conditions.push(or(
        gte(schema.jobs.salaryMax, filters.minSalary),
        eq(schema.jobs.salaryMax, sql`NULL`)
      )!);
    }
    
    if (filters.maxSalary) {
      conditions.push(or(
        lte(schema.jobs.salaryMin, filters.maxSalary),
        eq(schema.jobs.salaryMin, sql`NULL`)
      )!);
    }
    
    let query = db.select().from(schema.jobs);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }
    
    const jobs = await query;
    
    if (filters.skills && filters.skills.length > 0) {
      return jobs.filter(job => {
        const jobSkills = [...(job.requiredSkills || []), ...(job.preferredSkills || [])];
        return filters.skills!.some(skill => 
          jobSkills.some(js => js.toLowerCase().includes(skill.toLowerCase()))
        );
      });
    }
    
    return jobs;
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

  async createPasswordResetToken(insertToken: schema.InsertPasswordResetToken): Promise<schema.PasswordResetToken> {
    const [token] = await db.insert(schema.passwordResetTokens).values(insertToken).returning();
    return token;
  }

  async getPasswordResetToken(userId: string, token: string): Promise<schema.PasswordResetToken | undefined> {
    const { and } = await import("drizzle-orm");
    const [resetToken] = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(and(
        eq(schema.passwordResetTokens.userId, userId),
        eq(schema.passwordResetTokens.token, token)
      ));
    return resetToken;
  }

  async deletePasswordResetToken(id: string): Promise<void> {
    await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.id, id));
  }

  async deletePasswordResetTokensByUserId(userId: string): Promise<void> {
    await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    return;
  }

  async getCandidateTags(jobSeekerId?: string, employerId?: string): Promise<schema.CandidateTag[]> {
    const { and } = await import("drizzle-orm");
    const conditions = [];
    if (jobSeekerId) {
      conditions.push(eq(schema.candidateTags.jobSeekerId, jobSeekerId));
    }
    if (employerId) {
      conditions.push(eq(schema.candidateTags.employerId, employerId));
    }
    if (conditions.length > 0) {
      return db.select().from(schema.candidateTags).where(and(...conditions));
    }
    return db.select().from(schema.candidateTags);
  }

  async createCandidateTag(tag: schema.InsertCandidateTag): Promise<schema.CandidateTag> {
    const [created] = await db.insert(schema.candidateTags).values(tag).returning();
    return created;
  }

  async deleteCandidateTag(id: string): Promise<void> {
    await db.delete(schema.candidateTags).where(eq(schema.candidateTags.id, id));
  }

  async getCandidateNotes(jobSeekerId?: string, employerId?: string): Promise<schema.CandidateNote[]> {
    const { and } = await import("drizzle-orm");
    const conditions = [];
    if (jobSeekerId) {
      conditions.push(eq(schema.candidateNotes.jobSeekerId, jobSeekerId));
    }
    if (employerId) {
      conditions.push(eq(schema.candidateNotes.employerId, employerId));
    }
    if (conditions.length > 0) {
      return db.select().from(schema.candidateNotes).where(and(...conditions));
    }
    return db.select().from(schema.candidateNotes);
  }

  async createCandidateNote(note: schema.InsertCandidateNote): Promise<schema.CandidateNote> {
    const [created] = await db.insert(schema.candidateNotes).values(note).returning();
    return created;
  }

  async updateCandidateNote(id: string, data: Partial<schema.InsertCandidateNote>): Promise<schema.CandidateNote> {
    const [updated] = await db.update(schema.candidateNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.candidateNotes.id, id))
      .returning();
    return updated;
  }

  async deleteCandidateNote(id: string): Promise<void> {
    await db.delete(schema.candidateNotes).where(eq(schema.candidateNotes.id, id));
  }

  async getCandidateRatings(jobSeekerId?: string, employerId?: string): Promise<schema.CandidateRating[]> {
    const { and } = await import("drizzle-orm");
    const conditions = [];
    if (jobSeekerId) {
      conditions.push(eq(schema.candidateRatings.jobSeekerId, jobSeekerId));
    }
    if (employerId) {
      conditions.push(eq(schema.candidateRatings.employerId, employerId));
    }
    if (conditions.length > 0) {
      return db.select().from(schema.candidateRatings).where(and(...conditions));
    }
    return db.select().from(schema.candidateRatings);
  }

  async createCandidateRating(rating: schema.InsertCandidateRating): Promise<schema.CandidateRating> {
    const [created] = await db.insert(schema.candidateRatings).values(rating).returning();
    return created;
  }

  async updateCandidateRating(id: string, data: Partial<schema.InsertCandidateRating>): Promise<schema.CandidateRating> {
    const [updated] = await db.update(schema.candidateRatings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.candidateRatings.id, id))
      .returning();
    return updated;
  }

  async getGithubRepos(jobSeekerId: string): Promise<schema.GithubRepo[]> {
    return db.select().from(schema.githubRepos).where(eq(schema.githubRepos.jobSeekerId, jobSeekerId));
  }

  async createGithubRepo(repo: schema.InsertGithubRepo): Promise<schema.GithubRepo> {
    const [created] = await db.insert(schema.githubRepos).values(repo).returning();
    return created;
  }

  async deleteGithubRepo(id: string): Promise<void> {
    await db.delete(schema.githubRepos).where(eq(schema.githubRepos.id, id));
  }

  async getResumeParseQueue(jobSeekerId?: string): Promise<schema.ResumeParseQueue[]> {
    if (jobSeekerId) {
      return db.select().from(schema.resumeParseQueue).where(eq(schema.resumeParseQueue.jobSeekerId, jobSeekerId));
    }
    return db.select().from(schema.resumeParseQueue);
  }

  async createResumeParseQueueItem(item: schema.InsertResumeParseQueue): Promise<schema.ResumeParseQueue> {
    const [created] = await db.insert(schema.resumeParseQueue).values(item as any).returning();
    return created;
  }

  async updateResumeParseQueueItem(id: string, data: Partial<schema.InsertResumeParseQueue>): Promise<schema.ResumeParseQueue> {
    const [updated] = await db.update(schema.resumeParseQueue)
      .set(data as any)
      .where(eq(schema.resumeParseQueue.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DbStorage();
