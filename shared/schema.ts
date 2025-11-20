import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").default("job_seeker"),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  googleId: text("google_id"),
  githubId: text("github_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobSeekers = pgTable("job_seekers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentRole: text("current_role"),
  location: text("location"),
  remote: boolean("remote").default(true),
  experience: text("experience"),
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  bio: text("bio"),
  skills: text("skills").array(),
  profileComplete: boolean("profile_complete").default(false),
  profileVisibility: text("profile_visibility").default("public"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const employers = pgTable("employers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  companyLogo: text("company_logo"),
  industry: text("industry"),
  companySize: text("company_size"),
  website: text("website"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id").notNull().references(() => employers.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  remote: boolean("remote").default(false),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("USD"),
  requiredSkills: text("required_skills").array(),
  preferredSkills: text("preferred_skills").array(),
  experienceLevel: text("experience_level"),
  employmentType: text("employment_type"),
  status: text("status").notNull().default("draft"),
  aiProcessed: boolean("ai_processed").default(false),
  aiParsedData: jsonb("ai_parsed_data").$type<{
    extractedSkills?: string[];
    extractedSeniority?: string;
    suggestedSalaryMin?: number;
    suggestedSalaryMax?: number;
    confidence?: number;
  }>(),
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  status: text("status").notNull().default("applied"),
  stage: text("stage").notNull().default("applied"),
  coverLetter: text("cover_letter"),
  timeline: jsonb("timeline").$type<Array<{
    stage: string;
    status: string;
    date: string;
    note?: string;
    changedBy?: string;
  }>>().default(sql`'[]'::jsonb`),
  rejectionReason: text("rejection_reason"),
  offerDetails: jsonb("offer_details").$type<{
    salary?: number;
    startDate?: string;
    benefits?: string[];
    notes?: string;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  matchScore: integer("match_score").notNull(),
  matchingSkills: text("matching_skills").array(),
  gapSkills: text("gap_skills").array(),
  explanation: text("explanation").notNull(),
  aiMetadata: jsonb("ai_metadata"),
  viewed: boolean("viewed").default(false),
  bookmarked: boolean("bookmarked").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const learningPlans = pgTable("learning_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  targetRole: text("target_role").notNull(),
  currentSkills: text("current_skills").array(),
  targetSkills: text("target_skills").array(),
  roadmap: jsonb("roadmap").$type<Array<{
    skill: string;
    priority: string;
    estimatedTime: string;
    resources: Array<{ title: string; url: string; type: string }>;
  }>>(),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamInvitations = pgTable("team_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  email: text("email").notNull(),
  role: text("role").notNull().default("employer"),
  status: text("status").notNull().default("pending"),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const candidateTags = pgTable("candidate_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  employerId: varchar("employer_id").notNull().references(() => employers.id),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const candidateNotes = pgTable("candidate_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  employerId: varchar("employer_id").notNull().references(() => employers.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const candidateRatings = pgTable("candidate_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  employerId: varchar("employer_id").notNull().references(() => employers.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  category: text("category").notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const githubRepos = pgTable("github_repos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  repoName: text("repo_name").notNull(),
  repoUrl: text("repo_url").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").default(0),
  forks: integer("forks").default(0),
  topics: text("topics").array(),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resumeParseQueue = pgTable("resume_parse_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  resumeUrl: text("resume_url").notNull(),
  status: text("status").notNull().default("pending"),
  parsedData: jsonb("parsed_data").$type<{
    skills?: string[];
    experience?: string;
    education?: string[];
    summary?: string;
  }>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const skillEvidence = pgTable("skill_evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  skill: text("skill").notNull(),
  evidenceType: text("evidence_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  fileUrl: text("file_url"),
  metadata: jsonb("metadata").$type<{
    projectDuration?: string;
    role?: string;
    technologies?: string[];
    metrics?: string;
  }>(),
  verificationStatus: text("verification_status").default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const skillEndorsements = pgTable("skill_endorsements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  endorserId: varchar("endorser_id").notNull().references(() => users.id),
  skill: text("skill").notNull(),
  relationship: text("relationship").notNull(),
  comment: text("comment"),
  rating: integer("rating").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const skillTests = pgTable("skill_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  skill: text("skill").notNull(),
  testType: text("test_type").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  percentile: integer("percentile"),
  duration: integer("duration"),
  questions: jsonb("questions").$type<Array<{
    question: string;
    userAnswer?: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>>(),
  certificateUrl: text("certificate_url"),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobSeekerId: varchar("job_seeker_id").notNull().references(() => jobSeekers.id),
  badgeType: text("badge_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  criteria: jsonb("criteria").$type<{
    type: string;
    value: any;
    threshold?: number;
  }>(),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
  displayOrder: integer("display_order").default(0),
});

export const matchFeedback = pgTable("match_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id),
  feedbackType: text("feedback_type").notNull(),
  rating: integer("rating"),
  isRelevant: boolean("is_relevant"),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const skillEmbeddings = pgTable("skill_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  skillText: text("skill_text").notNull(),
  embedding: text("embedding").notNull(),
  model: text("model").notNull().default("text-embedding-3-small"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const matchingWeights = pgTable("matching_weights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weightType: text("weight_type").notNull(),
  factor: text("factor").notNull(),
  weight: integer("weight").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(60),
  interviewType: text("interview_type").notNull(),
  location: text("location"),
  meetingUrl: text("meeting_url"),
  interviewers: text("interviewers").array(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  feedback: jsonb("feedback").$type<{
    rating?: number;
    comments?: string;
    strengths?: string[];
    concerns?: string[];
  }>(),
  calendarEventId: text("calendar_event_id"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: varchar("related_entity_id"),
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const integrationConfigs = pgTable("integration_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  integrationType: text("integration_type").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  config: jsonb("config").$type<{
    webhookUrl?: string;
    apiKey?: string;
    channelId?: string;
    calendarId?: string;
    settings?: Record<string, any>;
  }>(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const upsertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertJobSeekerSchema = createInsertSchema(jobSeekers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployerSchema = createInsertSchema(employers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true });
export const insertLearningPlanSchema = createInsertSchema(learningPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({ id: true, createdAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertCandidateTagSchema = createInsertSchema(candidateTags).omit({ id: true, createdAt: true });
export const insertCandidateNoteSchema = createInsertSchema(candidateNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCandidateRatingSchema = createInsertSchema(candidateRatings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGithubRepoSchema = createInsertSchema(githubRepos).omit({ id: true, createdAt: true });
export const insertResumeParseQueueSchema = createInsertSchema(resumeParseQueue).omit({ id: true, createdAt: true, processedAt: true });
export const insertSkillEvidenceSchema = createInsertSchema(skillEvidence).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSkillEndorsementSchema = createInsertSchema(skillEndorsements).omit({ id: true, createdAt: true });
export const insertSkillTestSchema = createInsertSchema(skillTests).omit({ id: true, createdAt: true, completedAt: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, awardedAt: true });
export const insertMatchFeedbackSchema = createInsertSchema(matchFeedback).omit({ id: true, createdAt: true });
export const insertSkillEmbeddingSchema = createInsertSchema(skillEmbeddings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatchingWeightSchema = createInsertSchema(matchingWeights).omit({ id: true, updatedAt: true });
export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertIntegrationConfigSchema = createInsertSchema(integrationConfigs).omit({ id: true, createdAt: true, updatedAt: true });

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type JobSeeker = typeof jobSeekers.$inferSelect;
export type InsertJobSeeker = z.infer<typeof insertJobSeekerSchema>;

export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type LearningPlan = typeof learningPlans.$inferSelect;
export type InsertLearningPlan = z.infer<typeof insertLearningPlanSchema>;

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type CandidateTag = typeof candidateTags.$inferSelect;
export type InsertCandidateTag = z.infer<typeof insertCandidateTagSchema>;

export type CandidateNote = typeof candidateNotes.$inferSelect;
export type InsertCandidateNote = z.infer<typeof insertCandidateNoteSchema>;

export type CandidateRating = typeof candidateRatings.$inferSelect;
export type InsertCandidateRating = z.infer<typeof insertCandidateRatingSchema>;

export type GithubRepo = typeof githubRepos.$inferSelect;
export type InsertGithubRepo = z.infer<typeof insertGithubRepoSchema>;

export type ResumeParseQueue = typeof resumeParseQueue.$inferSelect;
export type InsertResumeParseQueue = z.infer<typeof insertResumeParseQueueSchema>;

export type SkillEvidence = typeof skillEvidence.$inferSelect;
export type InsertSkillEvidence = z.infer<typeof insertSkillEvidenceSchema>;

export type SkillEndorsement = typeof skillEndorsements.$inferSelect;
export type InsertSkillEndorsement = z.infer<typeof insertSkillEndorsementSchema>;

export type SkillTest = typeof skillTests.$inferSelect;
export type InsertSkillTest = z.infer<typeof insertSkillTestSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type MatchFeedback = typeof matchFeedback.$inferSelect;
export type InsertMatchFeedback = z.infer<typeof insertMatchFeedbackSchema>;

export type SkillEmbedding = typeof skillEmbeddings.$inferSelect;
export type InsertSkillEmbedding = z.infer<typeof insertSkillEmbeddingSchema>;

export type MatchingWeight = typeof matchingWeights.$inferSelect;
export type InsertMatchingWeight = z.infer<typeof insertMatchingWeightSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
export type InsertIntegrationConfig = z.infer<typeof insertIntegrationConfigSchema>;
