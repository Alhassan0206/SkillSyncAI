import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  getAllUsers(): Promise<schema.User[]>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  upsertUser(user: schema.UpsertUser): Promise<schema.User>;
  updateUser(id: string, data: Partial<schema.InsertUser>): Promise<schema.User>;
  deleteUser(id: string): Promise<void>;
  
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
  getApplicationsByEmployer(employerId: string): Promise<schema.Application[]>;
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
  deleteTenant(id: string): Promise<void>;

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

  getSkillEvidence(jobSeekerId: string, skill?: string): Promise<schema.SkillEvidence[]>;
  createSkillEvidence(evidence: schema.InsertSkillEvidence): Promise<schema.SkillEvidence>;
  updateSkillEvidence(id: string, data: Partial<schema.InsertSkillEvidence>): Promise<schema.SkillEvidence>;
  deleteSkillEvidence(id: string): Promise<void>;

  getSkillEndorsements(jobSeekerId: string, skill?: string): Promise<schema.SkillEndorsement[]>;
  createSkillEndorsement(endorsement: schema.InsertSkillEndorsement): Promise<schema.SkillEndorsement>;
  deleteSkillEndorsement(id: string): Promise<void>;

  getSkillTests(jobSeekerId: string, skill?: string): Promise<schema.SkillTest[]>;
  createSkillTest(test: schema.InsertSkillTest): Promise<schema.SkillTest>;
  getSkillTestById(id: string): Promise<schema.SkillTest | undefined>;

  getAchievements(jobSeekerId: string): Promise<schema.Achievement[]>;
  createAchievement(achievement: schema.InsertAchievement): Promise<schema.Achievement>;
  deleteAchievement(id: string): Promise<void>;

  getMatchFeedback(matchId: string): Promise<schema.MatchFeedback[]>;
  createMatchFeedback(feedback: schema.InsertMatchFeedback): Promise<schema.MatchFeedback>;

  getSkillEmbedding(entityType: string, entityId: string): Promise<schema.SkillEmbedding | undefined>;
  createSkillEmbedding(embedding: schema.InsertSkillEmbedding): Promise<schema.SkillEmbedding>;
  updateSkillEmbedding(id: string, data: Partial<schema.InsertSkillEmbedding>): Promise<schema.SkillEmbedding>;

  getMatchingWeights(weightType?: string): Promise<schema.MatchingWeight[]>;
  createMatchingWeight(weight: schema.InsertMatchingWeight): Promise<schema.MatchingWeight>;
  updateMatchingWeight(id: string, data: Partial<schema.InsertMatchingWeight>): Promise<schema.MatchingWeight>;

  getInterviews(applicationId?: string): Promise<schema.Interview[]>;
  getInterviewById(id: string): Promise<schema.Interview | undefined>;
  createInterview(interview: schema.InsertInterview): Promise<schema.Interview>;
  updateInterview(id: string, data: Partial<schema.InsertInterview>): Promise<schema.Interview>;
  deleteInterview(id: string): Promise<void>;

  getNotifications(userId: string, limit?: number, offset?: number): Promise<schema.Notification[]>;
  getNotificationById(id: string): Promise<schema.Notification | undefined>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: schema.InsertNotification): Promise<schema.Notification>;
  markNotificationAsRead(id: string): Promise<schema.Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  getIntegrationConfigs(tenantId: string, integrationType?: string): Promise<schema.IntegrationConfig[]>;
  getIntegrationConfigById(id: string): Promise<schema.IntegrationConfig | undefined>;
  createIntegrationConfig(config: schema.InsertIntegrationConfig): Promise<schema.IntegrationConfig>;
  updateIntegrationConfig(id: string, data: Partial<schema.InsertIntegrationConfig>): Promise<schema.IntegrationConfig>;
  deleteIntegrationConfig(id: string): Promise<void>;

  trackAnalyticsEvent(event: schema.InsertAnalyticsEvent): Promise<schema.AnalyticsEvent>;
  getAnalyticsEvents(tenantId: string, filters?: { entityType?: string; entityId?: string; startDate?: Date; endDate?: Date }): Promise<schema.AnalyticsEvent[]>;
  
  getJobMetrics(tenantId: string, jobId: string, startDate?: Date, endDate?: Date): Promise<schema.JobMetricsDaily[]>;
  upsertJobMetrics(metrics: schema.InsertJobMetricsDaily): Promise<schema.JobMetricsDaily>;
  
  getCandidateFunnelSnapshots(tenantId: string, jobId?: string, startDate?: Date, endDate?: Date): Promise<schema.CandidateFunnelSnapshot[]>;
  createCandidateFunnelSnapshot(snapshot: schema.InsertCandidateFunnelSnapshot): Promise<schema.CandidateFunnelSnapshot>;
  
  getTimeToHireRecords(tenantId: string, jobId?: string, startDate?: Date, endDate?: Date): Promise<schema.TimeToHireRecord[]>;
  createTimeToHireRecord(record: schema.InsertTimeToHireRecord): Promise<schema.TimeToHireRecord>;
  
  getRevenueTransactions(tenantId: string, startDate?: Date, endDate?: Date): Promise<schema.RevenueTransaction[]>;
  createRevenueTransaction(transaction: schema.InsertRevenueTransaction): Promise<schema.RevenueTransaction>;
  
  getRevenueAggregates(tenantId: string, startMonth?: Date, endMonth?: Date): Promise<schema.RevenueAggregateMonthly[]>;
  upsertRevenueAggregate(aggregate: schema.InsertRevenueAggregateMonthly): Promise<schema.RevenueAggregateMonthly>;

  // Contact Submissions
  createContactSubmission(submission: schema.InsertContactSubmission & { ipAddress?: string; userAgent?: string }): Promise<schema.ContactSubmission>;
  getContactSubmissions(status?: string): Promise<schema.ContactSubmission[]>;
  getContactSubmissionById(id: string): Promise<schema.ContactSubmission | undefined>;
  updateContactSubmission(id: string, data: Partial<schema.ContactSubmission>): Promise<schema.ContactSubmission>;

  // Feature Flags
  getFeatureFlags(): Promise<schema.FeatureFlag[]>;
  getFeatureFlagByKey(key: string): Promise<schema.FeatureFlag | undefined>;
  createFeatureFlag(flag: schema.InsertFeatureFlag): Promise<schema.FeatureFlag>;
  updateFeatureFlag(id: string, data: Partial<schema.InsertFeatureFlag>): Promise<schema.FeatureFlag>;
  deleteFeatureFlag(id: string): Promise<void>;

  // Audit Logs
  getAuditLogs(filters?: { userId?: string; tenantId?: string; action?: string; resource?: string; startDate?: Date; endDate?: Date; limit?: number; offset?: number }): Promise<schema.AuditLog[]>;
  createAuditLog(log: schema.InsertAuditLog): Promise<schema.AuditLog>;

  // Email Preferences
  getEmailPreferences(userId: string): Promise<schema.EmailPreferences | undefined>;
  getEmailPreferencesByToken(token: string): Promise<schema.EmailPreferences | undefined>;
  createEmailPreferences(prefs: schema.InsertEmailPreferences): Promise<schema.EmailPreferences>;
  updateEmailPreferences(userId: string, prefs: Partial<schema.InsertEmailPreferences>): Promise<schema.EmailPreferences>;

  // Email Logs
  createEmailLog(log: schema.InsertEmailLog): Promise<schema.EmailLog>;
  getEmailLogs(filters?: { userId?: string; emailType?: string; status?: string; limit?: number }): Promise<schema.EmailLog[]>;
  updateEmailLog(id: string, data: Partial<schema.EmailLog>): Promise<void>;

  // Analytics Helpers
  getApplicationCount(filters?: { startDate?: Date; tenantId?: string }): Promise<number>;
  getJobCount(filters?: { startDate?: Date; tenantId?: string }): Promise<number>;
  getUserCount(filters?: { startDate?: Date }): Promise<number>;
  getMatchCount(filters?: { startDate?: Date; tenantId?: string }): Promise<number>;

  // Webhook Subscriptions
  getWebhookSubscriptions(tenantId: string): Promise<schema.WebhookSubscription[]>;
  getWebhookSubscriptionById(id: string): Promise<schema.WebhookSubscription | undefined>;
  createWebhookSubscription(subscription: schema.InsertWebhookSubscription): Promise<schema.WebhookSubscription>;
  updateWebhookSubscription(id: string, data: Partial<schema.InsertWebhookSubscription>): Promise<schema.WebhookSubscription>;
  deleteWebhookSubscription(id: string): Promise<void>;

  // Webhook Delivery Attempts
  getWebhookDeliveryAttempts(subscriptionId: string, limit?: number): Promise<schema.WebhookDeliveryAttempt[]>;
  createWebhookDeliveryAttempt(attempt: schema.InsertWebhookDeliveryAttempt): Promise<schema.WebhookDeliveryAttempt>;
  updateWebhookDeliveryAttempt(id: string, data: Partial<schema.InsertWebhookDeliveryAttempt>): Promise<schema.WebhookDeliveryAttempt>;

  // Notification Preferences
  getNotificationPreferences(userId: string): Promise<schema.NotificationPreference[]>;
  getNotificationPreferenceByChannel(userId: string, channel: string): Promise<schema.NotificationPreference | undefined>;
  createNotificationPreference(pref: schema.InsertNotificationPreference): Promise<schema.NotificationPreference>;
  updateNotificationPreference(id: string, data: Partial<schema.InsertNotificationPreference>): Promise<schema.NotificationPreference>;
  upsertNotificationPreference(userId: string, channel: string, data: Partial<schema.InsertNotificationPreference>): Promise<schema.NotificationPreference>;

  // Usage Tracking
  recordUsage(record: schema.InsertUsageRecord): Promise<schema.UsageRecord>;
  getUsageRecords(userId: string, featureType?: string, periodStart?: Date, periodEnd?: Date): Promise<schema.UsageRecord[]>;
  getUsageAggregate(userId: string, featureType: string, periodMonth: string): Promise<schema.UsageAggregate | undefined>;
  upsertUsageAggregate(userId: string, tenantId: string | null, featureType: string, periodMonth: string, increment: number, limit?: number): Promise<schema.UsageAggregate>;
  getUserUsageSummary(userId: string, periodMonth: string): Promise<schema.UsageAggregate[]>;
  getTenantUsageSummary(tenantId: string, periodMonth: string): Promise<schema.UsageAggregate[]>;
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

  async updateUser(id: string, data: Partial<schema.InsertUser>): Promise<schema.User> {
    const [user] = await db.update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
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

  async getApplicationsByEmployer(employerId: string): Promise<schema.Application[]> {
    const jobs = await this.getJobs(employerId);
    const jobIds = jobs.map(j => j.id);
    
    if (jobIds.length === 0) {
      return [];
    }
    
    const applications = await db.select().from(schema.applications);
    return applications.filter(app => jobIds.includes(app.jobId));
  }

  async createApplication(insertApplication: schema.InsertApplication): Promise<schema.Application> {
    const initialTimeline = [{
      from: 'applied',
      to: 'applied',
      stage: 'applied',
      status: 'applied',
      date: new Date().toISOString(),
      changedBy: 'System',
      note: 'Application submitted',
    }];
    
    const applicationWithTimeline = {
      ...insertApplication,
      timeline: initialTimeline as any,
    };
    
    const [application] = await db.insert(schema.applications).values(applicationWithTimeline as any).returning();
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

  async deleteTenant(id: string): Promise<void> {
    await db.delete(schema.tenants).where(eq(schema.tenants.id, id));
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

  async getSkillEvidence(jobSeekerId: string, skill?: string): Promise<schema.SkillEvidence[]> {
    const { and } = await import("drizzle-orm");
    if (skill) {
      return db.select().from(schema.skillEvidence).where(and(
        eq(schema.skillEvidence.jobSeekerId, jobSeekerId),
        eq(schema.skillEvidence.skill, skill)
      ));
    }
    return db.select().from(schema.skillEvidence).where(eq(schema.skillEvidence.jobSeekerId, jobSeekerId));
  }

  async createSkillEvidence(evidence: schema.InsertSkillEvidence): Promise<schema.SkillEvidence> {
    const [created] = await db.insert(schema.skillEvidence).values(evidence as any).returning();
    return created;
  }

  async updateSkillEvidence(id: string, data: Partial<schema.InsertSkillEvidence>): Promise<schema.SkillEvidence> {
    const [updated] = await db.update(schema.skillEvidence)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(schema.skillEvidence.id, id))
      .returning();
    return updated;
  }

  async deleteSkillEvidence(id: string): Promise<void> {
    await db.delete(schema.skillEvidence).where(eq(schema.skillEvidence.id, id));
  }

  async getSkillEndorsements(jobSeekerId: string, skill?: string): Promise<schema.SkillEndorsement[]> {
    const { and } = await import("drizzle-orm");
    if (skill) {
      return db.select().from(schema.skillEndorsements).where(and(
        eq(schema.skillEndorsements.jobSeekerId, jobSeekerId),
        eq(schema.skillEndorsements.skill, skill)
      ));
    }
    return db.select().from(schema.skillEndorsements).where(eq(schema.skillEndorsements.jobSeekerId, jobSeekerId));
  }

  async createSkillEndorsement(endorsement: schema.InsertSkillEndorsement): Promise<schema.SkillEndorsement> {
    const [created] = await db.insert(schema.skillEndorsements).values(endorsement).returning();
    return created;
  }

  async deleteSkillEndorsement(id: string): Promise<void> {
    await db.delete(schema.skillEndorsements).where(eq(schema.skillEndorsements.id, id));
  }

  async getSkillTests(jobSeekerId: string, skill?: string): Promise<schema.SkillTest[]> {
    const { and } = await import("drizzle-orm");
    if (skill) {
      return db.select().from(schema.skillTests).where(and(
        eq(schema.skillTests.jobSeekerId, jobSeekerId),
        eq(schema.skillTests.skill, skill)
      ));
    }
    return db.select().from(schema.skillTests).where(eq(schema.skillTests.jobSeekerId, jobSeekerId));
  }

  async createSkillTest(test: schema.InsertSkillTest): Promise<schema.SkillTest> {
    const [created] = await db.insert(schema.skillTests).values(test as any).returning();
    return created;
  }

  async getSkillTestById(id: string): Promise<schema.SkillTest | undefined> {
    const [test] = await db.select().from(schema.skillTests).where(eq(schema.skillTests.id, id));
    return test;
  }

  async getAchievements(jobSeekerId: string): Promise<schema.Achievement[]> {
    return db.select().from(schema.achievements).where(eq(schema.achievements.jobSeekerId, jobSeekerId));
  }

  async createAchievement(achievement: schema.InsertAchievement): Promise<schema.Achievement> {
    const [created] = await db.insert(schema.achievements).values(achievement as any).returning();
    return created;
  }

  async deleteAchievement(id: string): Promise<void> {
    await db.delete(schema.achievements).where(eq(schema.achievements.id, id));
  }

  async getMatchFeedback(matchId: string): Promise<schema.MatchFeedback[]> {
    return db.select().from(schema.matchFeedback).where(eq(schema.matchFeedback.matchId, matchId));
  }

  async createMatchFeedback(feedback: schema.InsertMatchFeedback): Promise<schema.MatchFeedback> {
    const [created] = await db.insert(schema.matchFeedback).values(feedback).returning();
    return created;
  }

  async getSkillEmbedding(entityType: string, entityId: string): Promise<schema.SkillEmbedding | undefined> {
    const { and } = await import("drizzle-orm");
    const [embedding] = await db.select().from(schema.skillEmbeddings).where(and(
      eq(schema.skillEmbeddings.entityType, entityType),
      eq(schema.skillEmbeddings.entityId, entityId)
    ));
    return embedding;
  }

  async createSkillEmbedding(embedding: schema.InsertSkillEmbedding): Promise<schema.SkillEmbedding> {
    const [created] = await db.insert(schema.skillEmbeddings).values(embedding).returning();
    return created;
  }

  async updateSkillEmbedding(id: string, data: Partial<schema.InsertSkillEmbedding>): Promise<schema.SkillEmbedding> {
    const [updated] = await db.update(schema.skillEmbeddings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.skillEmbeddings.id, id))
      .returning();
    return updated;
  }

  async getMatchingWeights(weightType?: string): Promise<schema.MatchingWeight[]> {
    if (weightType) {
      return db.select().from(schema.matchingWeights).where(eq(schema.matchingWeights.weightType, weightType));
    }
    return db.select().from(schema.matchingWeights);
  }

  async createMatchingWeight(weight: schema.InsertMatchingWeight): Promise<schema.MatchingWeight> {
    const [created] = await db.insert(schema.matchingWeights).values(weight).returning();
    return created;
  }

  async updateMatchingWeight(id: string, data: Partial<schema.InsertMatchingWeight>): Promise<schema.MatchingWeight> {
    const [updated] = await db.update(schema.matchingWeights)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.matchingWeights.id, id))
      .returning();
    return updated;
  }

  async getInterviews(applicationId?: string): Promise<schema.Interview[]> {
    if (applicationId) {
      return db.select().from(schema.interviews).where(eq(schema.interviews.applicationId, applicationId));
    }
    return db.select().from(schema.interviews);
  }

  async getInterviewById(id: string): Promise<schema.Interview | undefined> {
    const [interview] = await db.select().from(schema.interviews).where(eq(schema.interviews.id, id));
    return interview;
  }

  async createInterview(interview: schema.InsertInterview): Promise<schema.Interview> {
    const [created] = await db.insert(schema.interviews).values(interview as typeof schema.interviews.$inferInsert).returning();
    return created;
  }

  async updateInterview(id: string, data: Partial<schema.InsertInterview>): Promise<schema.Interview> {
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(schema.interviews)
      .set(updateData as Partial<typeof schema.interviews.$inferInsert>)
      .where(eq(schema.interviews.id, id))
      .returning();
    return updated;
  }

  async deleteInterview(id: string): Promise<void> {
    await db.delete(schema.interviews).where(eq(schema.interviews.id, id));
  }

  async getNotifications(userId: string, limit = 50, offset = 0): Promise<schema.Notification[]> {
    const { desc } = await import("drizzle-orm");
    return db.select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getNotificationById(id: string): Promise<schema.Notification | undefined> {
    const [notification] = await db.select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, id));
    return notification;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const { and, count } = await import("drizzle-orm");
    const [result] = await db.select({ count: count() })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.read, false)
      ));
    return result?.count || 0;
  }

  async createNotification(notification: schema.InsertNotification): Promise<schema.Notification> {
    const [created] = await db.insert(schema.notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(id: string): Promise<schema.Notification> {
    const [updated] = await db.update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.userId, userId));
  }

  async getIntegrationConfigs(tenantId: string, integrationType?: string): Promise<schema.IntegrationConfig[]> {
    const { and } = await import("drizzle-orm");
    if (integrationType) {
      return db.select().from(schema.integrationConfigs).where(and(
        eq(schema.integrationConfigs.tenantId, tenantId),
        eq(schema.integrationConfigs.integrationType, integrationType)
      ));
    }
    return db.select().from(schema.integrationConfigs).where(eq(schema.integrationConfigs.tenantId, tenantId));
  }

  async getIntegrationConfigById(id: string): Promise<schema.IntegrationConfig | undefined> {
    const [config] = await db.select().from(schema.integrationConfigs).where(eq(schema.integrationConfigs.id, id));
    return config;
  }

  async createIntegrationConfig(config: schema.InsertIntegrationConfig): Promise<schema.IntegrationConfig> {
    const [created] = await db.insert(schema.integrationConfigs).values(config as typeof schema.integrationConfigs.$inferInsert).returning();
    return created;
  }

  async updateIntegrationConfig(id: string, data: Partial<schema.InsertIntegrationConfig>): Promise<schema.IntegrationConfig> {
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(schema.integrationConfigs)
      .set(updateData as Partial<typeof schema.integrationConfigs.$inferInsert>)
      .where(eq(schema.integrationConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteIntegrationConfig(id: string): Promise<void> {
    await db.delete(schema.integrationConfigs).where(eq(schema.integrationConfigs.id, id));
  }

  async trackAnalyticsEvent(event: schema.InsertAnalyticsEvent): Promise<schema.AnalyticsEvent> {
    const [created] = await db.insert(schema.analyticsEvents).values(event as typeof schema.analyticsEvents.$inferInsert).returning();
    return created;
  }

  async getAnalyticsEvents(tenantId: string, filters?: { entityType?: string; entityId?: string; startDate?: Date; endDate?: Date }): Promise<schema.AnalyticsEvent[]> {
    const { and, gte, lte } = await import("drizzle-orm");
    const conditions = [eq(schema.analyticsEvents.tenantId, tenantId)];
    
    if (filters?.entityType) {
      conditions.push(eq(schema.analyticsEvents.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(schema.analyticsEvents.entityId, filters.entityId));
    }
    if (filters?.startDate) {
      conditions.push(gte(schema.analyticsEvents.occurredAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(schema.analyticsEvents.occurredAt, filters.endDate));
    }
    
    return db.select().from(schema.analyticsEvents).where(and(...conditions)).orderBy(schema.analyticsEvents.occurredAt);
  }

  async getJobMetrics(tenantId: string, jobId: string, startDate?: Date, endDate?: Date): Promise<schema.JobMetricsDaily[]> {
    const { and, gte, lte } = await import("drizzle-orm");
    
    const job = await this.getJobById(jobId);
    if (!job) {
      return [];
    }
    
    const employerWithUser = await db.select({ employer: schema.employers, user: schema.users })
      .from(schema.employers)
      .innerJoin(schema.users, eq(schema.employers.userId, schema.users.id))
      .where(eq(schema.employers.id, job.employerId))
      .limit(1);
    if (!employerWithUser[0] || employerWithUser[0].user.tenantId !== tenantId) {
      return [];
    }
    
    const conditions = [eq(schema.jobMetricsDaily.jobId, jobId)];
    
    if (startDate) {
      conditions.push(gte(schema.jobMetricsDaily.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(schema.jobMetricsDaily.date, endDate));
    }
    
    return db.select().from(schema.jobMetricsDaily).where(and(...conditions)).orderBy(schema.jobMetricsDaily.date);
  }

  async upsertJobMetrics(metrics: schema.InsertJobMetricsDaily): Promise<schema.JobMetricsDaily> {
    const [result] = await db.insert(schema.jobMetricsDaily)
      .values(metrics)
      .onConflictDoUpdate({
        target: [schema.jobMetricsDaily.jobId, schema.jobMetricsDaily.date],
        set: {
          ...metrics,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getCandidateFunnelSnapshots(tenantId: string, jobId?: string, startDate?: Date, endDate?: Date): Promise<schema.CandidateFunnelSnapshot[]> {
    const { and, gte, lte } = await import("drizzle-orm");
    const conditions = [eq(schema.candidateFunnelSnapshots.tenantId, tenantId)];
    
    if (jobId) {
      conditions.push(eq(schema.candidateFunnelSnapshots.jobId, jobId));
    }
    if (startDate) {
      conditions.push(gte(schema.candidateFunnelSnapshots.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(schema.candidateFunnelSnapshots.date, endDate));
    }
    
    return db.select().from(schema.candidateFunnelSnapshots).where(and(...conditions)).orderBy(schema.candidateFunnelSnapshots.date);
  }

  async createCandidateFunnelSnapshot(snapshot: schema.InsertCandidateFunnelSnapshot): Promise<schema.CandidateFunnelSnapshot> {
    const [created] = await db.insert(schema.candidateFunnelSnapshots).values(snapshot).returning();
    return created;
  }

  async getTimeToHireRecords(tenantId: string, jobId?: string, startDate?: Date, endDate?: Date): Promise<schema.TimeToHireRecord[]> {
    const { and, gte, lte, inArray } = await import("drizzle-orm");

    const tenantJobs = await db.select({ id: schema.jobs.id })
      .from(schema.jobs)
      .innerJoin(schema.employers, eq(schema.jobs.employerId, schema.employers.id))
      .innerJoin(schema.users, eq(schema.employers.userId, schema.users.id))
      .where(eq(schema.users.tenantId, tenantId));
    
    const tenantJobIds = tenantJobs.map(j => j.id);
    if (tenantJobIds.length === 0) {
      return [];
    }
    
    const conditions = [inArray(schema.timeToHireRecords.jobId, tenantJobIds)];
    
    if (jobId) {
      conditions.push(eq(schema.timeToHireRecords.jobId, jobId));
    }
    if (startDate) {
      conditions.push(gte(schema.timeToHireRecords.hiredAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(schema.timeToHireRecords.hiredAt, endDate));
    }
    
    return db.select().from(schema.timeToHireRecords).where(and(...conditions)).orderBy(schema.timeToHireRecords.hiredAt);
  }

  async createTimeToHireRecord(record: schema.InsertTimeToHireRecord): Promise<schema.TimeToHireRecord> {
    const [created] = await db.insert(schema.timeToHireRecords).values(record as typeof schema.timeToHireRecords.$inferInsert).returning();
    return created;
  }

  async getRevenueTransactions(tenantId: string, startDate?: Date, endDate?: Date): Promise<schema.RevenueTransaction[]> {
    const { and, gte, lte } = await import("drizzle-orm");
    const conditions = [eq(schema.revenueTransactions.tenantId, tenantId)];

    if (startDate) {
      conditions.push(gte(schema.revenueTransactions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(schema.revenueTransactions.date, endDate));
    }

    return db.select().from(schema.revenueTransactions).where(and(...conditions)).orderBy(schema.revenueTransactions.date);
  }

  async createRevenueTransaction(transaction: schema.InsertRevenueTransaction): Promise<schema.RevenueTransaction> {
    const [created] = await db.insert(schema.revenueTransactions).values(transaction as typeof schema.revenueTransactions.$inferInsert).returning();
    return created;
  }

  async getRevenueAggregates(tenantId: string, startMonth?: Date, endMonth?: Date): Promise<schema.RevenueAggregateMonthly[]> {
    const { and, gte, lte } = await import("drizzle-orm");
    const conditions = [eq(schema.revenueAggregatesMonthly.tenantId, tenantId)];
    
    if (startMonth) {
      conditions.push(gte(schema.revenueAggregatesMonthly.month, startMonth));
    }
    if (endMonth) {
      conditions.push(lte(schema.revenueAggregatesMonthly.month, endMonth));
    }
    
    return db.select().from(schema.revenueAggregatesMonthly).where(and(...conditions)).orderBy(schema.revenueAggregatesMonthly.month);
  }

  async upsertRevenueAggregate(aggregate: schema.InsertRevenueAggregateMonthly): Promise<schema.RevenueAggregateMonthly> {
    const [result] = await db.insert(schema.revenueAggregatesMonthly)
      .values(aggregate)
      .onConflictDoUpdate({
        target: [schema.revenueAggregatesMonthly.tenantId, schema.revenueAggregatesMonthly.month],
        set: {
          ...aggregate,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Contact Submissions
  async createContactSubmission(submission: schema.InsertContactSubmission & { ipAddress?: string; userAgent?: string }): Promise<schema.ContactSubmission> {
    const [result] = await db.insert(schema.contactSubmissions).values(submission).returning();
    return result;
  }

  async getContactSubmissions(status?: string): Promise<schema.ContactSubmission[]> {
    const { desc } = await import("drizzle-orm");
    if (status) {
      return db.select().from(schema.contactSubmissions).where(eq(schema.contactSubmissions.status, status)).orderBy(desc(schema.contactSubmissions.createdAt));
    }
    return db.select().from(schema.contactSubmissions).orderBy(desc(schema.contactSubmissions.createdAt));
  }

  async getContactSubmissionById(id: string): Promise<schema.ContactSubmission | undefined> {
    const [result] = await db.select().from(schema.contactSubmissions).where(eq(schema.contactSubmissions.id, id));
    return result;
  }

  async updateContactSubmission(id: string, data: Partial<schema.ContactSubmission>): Promise<schema.ContactSubmission> {
    const [result] = await db.update(schema.contactSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.contactSubmissions.id, id))
      .returning();
    return result;
  }

  // Feature Flags
  async getFeatureFlags(): Promise<schema.FeatureFlag[]> {
    return db.select().from(schema.featureFlags);
  }

  async getFeatureFlagByKey(key: string): Promise<schema.FeatureFlag | undefined> {
    const [result] = await db.select().from(schema.featureFlags).where(eq(schema.featureFlags.key, key));
    return result;
  }

  async createFeatureFlag(flag: schema.InsertFeatureFlag): Promise<schema.FeatureFlag> {
    const [result] = await db.insert(schema.featureFlags).values(flag).returning();
    return result;
  }

  async updateFeatureFlag(id: string, data: Partial<schema.InsertFeatureFlag>): Promise<schema.FeatureFlag> {
    const [result] = await db.update(schema.featureFlags)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.featureFlags.id, id))
      .returning();
    return result;
  }

  async deleteFeatureFlag(id: string): Promise<void> {
    await db.delete(schema.featureFlags).where(eq(schema.featureFlags.id, id));
  }

  // Audit Logs
  async getAuditLogs(filters?: { userId?: string; tenantId?: string; action?: string; resource?: string; startDate?: Date; endDate?: Date; limit?: number; offset?: number }): Promise<schema.AuditLog[]> {
    const { and, desc, gte, lte } = await import("drizzle-orm");
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(schema.auditLogs.userId, filters.userId));
    }
    if (filters?.tenantId) {
      conditions.push(eq(schema.auditLogs.tenantId, filters.tenantId));
    }
    if (filters?.action) {
      conditions.push(eq(schema.auditLogs.action, filters.action));
    }
    if (filters?.resource) {
      conditions.push(eq(schema.auditLogs.resource, filters.resource));
    }
    if (filters?.startDate) {
      conditions.push(gte(schema.auditLogs.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(schema.auditLogs.createdAt, filters.endDate));
    }

    let query = db.select().from(schema.auditLogs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    query = query.orderBy(desc(schema.auditLogs.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return query;
  }

  async createAuditLog(log: schema.InsertAuditLog): Promise<schema.AuditLog> {
    const [result] = await db.insert(schema.auditLogs).values(log).returning();
    return result;
  }

  // Email Preferences
  async getEmailPreferences(userId: string): Promise<schema.EmailPreferences | undefined> {
    const [prefs] = await db.select().from(schema.emailPreferences).where(eq(schema.emailPreferences.userId, userId));
    return prefs;
  }

  async getEmailPreferencesByToken(token: string): Promise<schema.EmailPreferences | undefined> {
    const [prefs] = await db.select().from(schema.emailPreferences).where(eq(schema.emailPreferences.unsubscribeToken, token));
    return prefs;
  }

  async createEmailPreferences(prefs: schema.InsertEmailPreferences): Promise<schema.EmailPreferences> {
    const [result] = await db.insert(schema.emailPreferences).values(prefs).returning();
    return result;
  }

  async updateEmailPreferences(userId: string, prefs: Partial<schema.InsertEmailPreferences>): Promise<schema.EmailPreferences> {
    const [result] = await db.update(schema.emailPreferences)
      .set({ ...prefs, updatedAt: new Date() })
      .where(eq(schema.emailPreferences.userId, userId))
      .returning();
    return result;
  }

  // Email Logs
  async createEmailLog(log: schema.InsertEmailLog): Promise<schema.EmailLog> {
    const [result] = await db.insert(schema.emailLogs).values(log).returning();
    return result;
  }

  async getEmailLogs(filters?: { userId?: string; emailType?: string; status?: string; limit?: number }): Promise<schema.EmailLog[]> {
    let query = db.select().from(schema.emailLogs).orderBy(desc(schema.emailLogs.sentAt)) as any;

    if (filters?.userId) {
      query = query.where(eq(schema.emailLogs.userId, filters.userId));
    }
    if (filters?.emailType) {
      query = query.where(eq(schema.emailLogs.emailType, filters.emailType));
    }
    if (filters?.status) {
      query = query.where(eq(schema.emailLogs.status, filters.status));
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return query;
  }

  async updateEmailLog(id: string, data: Partial<schema.EmailLog>): Promise<void> {
    await db.update(schema.emailLogs).set(data).where(eq(schema.emailLogs.id, id));
  }

  // Analytics helper methods
  async getApplicationCount(filters?: { startDate?: Date; tenantId?: string }): Promise<number> {
    // Return a simple count - in production would have proper date/tenant filtering
    const result = await db.select().from(schema.applications);
    return result.length;
  }

  async getJobCount(filters?: { startDate?: Date; tenantId?: string }): Promise<number> {
    const result = await db.select().from(schema.jobs);
    return result.length;
  }

  async getUserCount(filters?: { startDate?: Date }): Promise<number> {
    const result = await db.select().from(schema.users);
    return result.length;
  }

  async getMatchCount(filters?: { startDate?: Date; tenantId?: string }): Promise<number> {
    const result = await db.select().from(schema.matches);
    return result.length;
  }

  // Webhook Subscriptions
  async getWebhookSubscriptions(tenantId: string): Promise<schema.WebhookSubscription[]> {
    return db.select().from(schema.webhookSubscriptions)
      .where(eq(schema.webhookSubscriptions.tenantId, tenantId))
      .orderBy(desc(schema.webhookSubscriptions.createdAt));
  }

  async getWebhookSubscriptionById(id: string): Promise<schema.WebhookSubscription | undefined> {
    const [subscription] = await db.select().from(schema.webhookSubscriptions)
      .where(eq(schema.webhookSubscriptions.id, id));
    return subscription;
  }

  async createWebhookSubscription(subscription: schema.InsertWebhookSubscription): Promise<schema.WebhookSubscription> {
    const [created] = await db.insert(schema.webhookSubscriptions)
      .values(subscription as typeof schema.webhookSubscriptions.$inferInsert)
      .returning();
    return created;
  }

  async updateWebhookSubscription(id: string, data: Partial<schema.InsertWebhookSubscription>): Promise<schema.WebhookSubscription> {
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(schema.webhookSubscriptions)
      .set(updateData as Partial<typeof schema.webhookSubscriptions.$inferInsert>)
      .where(eq(schema.webhookSubscriptions.id, id))
      .returning();
    return updated;
  }

  async deleteWebhookSubscription(id: string): Promise<void> {
    await db.delete(schema.webhookSubscriptions).where(eq(schema.webhookSubscriptions.id, id));
  }

  // Webhook Delivery Attempts
  async getWebhookDeliveryAttempts(subscriptionId: string, limit = 50): Promise<schema.WebhookDeliveryAttempt[]> {
    return db.select().from(schema.webhookDeliveryAttempts)
      .where(eq(schema.webhookDeliveryAttempts.subscriptionId, subscriptionId))
      .orderBy(desc(schema.webhookDeliveryAttempts.createdAt))
      .limit(limit);
  }

  async createWebhookDeliveryAttempt(attempt: schema.InsertWebhookDeliveryAttempt): Promise<schema.WebhookDeliveryAttempt> {
    const [created] = await db.insert(schema.webhookDeliveryAttempts)
      .values(attempt as typeof schema.webhookDeliveryAttempts.$inferInsert)
      .returning();
    return created;
  }

  async updateWebhookDeliveryAttempt(id: string, data: Partial<schema.InsertWebhookDeliveryAttempt>): Promise<schema.WebhookDeliveryAttempt> {
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(schema.webhookDeliveryAttempts)
      .set(updateData as Partial<typeof schema.webhookDeliveryAttempts.$inferInsert>)
      .where(eq(schema.webhookDeliveryAttempts.id, id))
      .returning();
    return updated;
  }

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<schema.NotificationPreference[]> {
    return db.select().from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userId));
  }

  async getNotificationPreferenceByChannel(userId: string, channel: string): Promise<schema.NotificationPreference | undefined> {
    const [pref] = await db.select().from(schema.notificationPreferences)
      .where(and(
        eq(schema.notificationPreferences.userId, userId),
        eq(schema.notificationPreferences.channel, channel)
      ));
    return pref;
  }

  async createNotificationPreference(pref: schema.InsertNotificationPreference): Promise<schema.NotificationPreference> {
    const [created] = await db.insert(schema.notificationPreferences)
      .values(pref as typeof schema.notificationPreferences.$inferInsert)
      .returning();
    return created;
  }

  async updateNotificationPreference(id: string, data: Partial<schema.InsertNotificationPreference>): Promise<schema.NotificationPreference> {
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(schema.notificationPreferences)
      .set(updateData as Partial<typeof schema.notificationPreferences.$inferInsert>)
      .where(eq(schema.notificationPreferences.id, id))
      .returning();
    return updated;
  }

  async upsertNotificationPreference(userId: string, channel: string, data: Partial<schema.InsertNotificationPreference>): Promise<schema.NotificationPreference> {
    const existing = await this.getNotificationPreferenceByChannel(userId, channel);
    if (existing) {
      return this.updateNotificationPreference(existing.id, data);
    }
    return this.createNotificationPreference({
      userId,
      channel,
      ...data,
    } as schema.InsertNotificationPreference);
  }

  // Usage Tracking
  async recordUsage(record: schema.InsertUsageRecord): Promise<schema.UsageRecord> {
    const [created] = await db.insert(schema.usageRecords).values(record as typeof schema.usageRecords.$inferInsert).returning();
    return created;
  }

  async getUsageRecords(userId: string, featureType?: string, periodStart?: Date, periodEnd?: Date): Promise<schema.UsageRecord[]> {
    const { and, gte, lte } = await import("drizzle-orm");
    const conditions = [eq(schema.usageRecords.userId, userId)];

    if (featureType) {
      conditions.push(eq(schema.usageRecords.featureType, featureType));
    }
    if (periodStart) {
      conditions.push(gte(schema.usageRecords.createdAt, periodStart));
    }
    if (periodEnd) {
      conditions.push(lte(schema.usageRecords.createdAt, periodEnd));
    }

    return db.select().from(schema.usageRecords).where(and(...conditions)).orderBy(schema.usageRecords.createdAt);
  }

  async getUsageAggregate(userId: string, featureType: string, periodMonth: string): Promise<schema.UsageAggregate | undefined> {
    const { and } = await import("drizzle-orm");
    const [aggregate] = await db.select().from(schema.usageAggregates).where(
      and(
        eq(schema.usageAggregates.userId, userId),
        eq(schema.usageAggregates.featureType, featureType),
        eq(schema.usageAggregates.periodMonth, periodMonth)
      )
    );
    return aggregate;
  }

  async upsertUsageAggregate(userId: string, tenantId: string | null, featureType: string, periodMonth: string, increment: number, limit?: number): Promise<schema.UsageAggregate> {
    const { and, sql } = await import("drizzle-orm");
    const existing = await this.getUsageAggregate(userId, featureType, periodMonth);

    if (existing) {
      const [updated] = await db
        .update(schema.usageAggregates)
        .set({
          totalUsage: sql`${schema.usageAggregates.totalUsage} + ${increment}`,
          usageLimit: limit !== undefined ? limit : existing.usageLimit,
          lastUpdated: new Date(),
        })
        .where(eq(schema.usageAggregates.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(schema.usageAggregates).values({
      userId,
      tenantId,
      featureType,
      periodMonth,
      totalUsage: increment,
      usageLimit: limit ?? null,
      lastUpdated: new Date(),
    } as typeof schema.usageAggregates.$inferInsert).returning();
    return created;
  }

  async getUserUsageSummary(userId: string, periodMonth: string): Promise<schema.UsageAggregate[]> {
    const { and } = await import("drizzle-orm");
    return db.select().from(schema.usageAggregates).where(
      and(
        eq(schema.usageAggregates.userId, userId),
        eq(schema.usageAggregates.periodMonth, periodMonth)
      )
    );
  }

  async getTenantUsageSummary(tenantId: string, periodMonth: string): Promise<schema.UsageAggregate[]> {
    const { and, sql } = await import("drizzle-orm");
    // Aggregate usage across all users in the tenant
    return db.select().from(schema.usageAggregates).where(
      and(
        eq(schema.usageAggregates.tenantId, tenantId),
        eq(schema.usageAggregates.periodMonth, periodMonth)
      )
    );
  }
}

export const storage = new DbStorage();
