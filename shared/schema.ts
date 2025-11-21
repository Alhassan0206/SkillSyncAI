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
  tenantId: varchar("tenant_id").references(() => tenants.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("normal"),
  category: text("category"),
  scheduledFor: timestamp("scheduled_for"),
  digestGroupId: varchar("digest_group_id"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: varchar("related_entity_id"),
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notifications_user_read").on(table.userId, table.read),
  index("idx_notifications_tenant_type_created").on(table.tenantId, table.type, table.createdAt),
]);

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

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  channel: text("channel").notNull(),
  enabled: boolean("enabled").default(true),
  digestEnabled: boolean("digest_enabled").default(false),
  digestFrequency: text("digest_frequency").default("daily"),
  quietHoursStart: text("quiet_hours_start"),
  quietHoursEnd: text("quiet_hours_end"),
  categories: jsonb("categories").$type<Record<string, boolean>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notification_prefs_user_channel").on(table.userId, table.channel),
]);

export const notificationChannels = pgTable("notification_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  channelType: text("channel_type").notNull(),
  channelName: text("channel_name").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  credentials: jsonb("credentials").$type<{
    slackChannelId?: string;
    slackUserId?: string;
    slackAccessToken?: string;
    emailFromAddress?: string;
    emailFromName?: string;
    webhookUrl?: string;
    webhookSecret?: string;
  }>(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notification_channels_tenant_type").on(table.tenantId, table.channelType),
]);

export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  channelType: text("channel_type").notNull(),
  templateKey: text("template_key").notNull(),
  version: integer("version").notNull().default(1),
  subject: text("subject"),
  body: text("body").notNull(),
  htmlBody: text("html_body"),
  theme: jsonb("theme").$type<{
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    footerText?: string;
    companyName?: string;
  }>(),
  locale: text("locale").default("en"),
  variables: jsonb("variables").$type<Record<string, string>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notificationDigestQueue = pgTable("notification_digest_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  digestGroupId: varchar("digest_group_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  channel: text("channel").notNull(),
  notificationIds: text("notification_ids").array(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_digest_queue_scheduled").on(table.status, table.scheduledFor),
]);

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id").notNull().references(() => notifications.id),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  nextAttemptAt: timestamp("next_attempt_at"),
  payload: jsonb("payload"),
  responseData: jsonb("response_data"),
  errorMessage: text("error_message"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notification_deliveries_pending").on(table.status, table.nextAttemptAt),
]);

export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  endpointUrl: text("endpoint_url").notNull(),
  secret: text("secret").notNull(),
  subscribedEvents: text("subscribed_events").array(),
  isEnabled: boolean("is_enabled").default(true),
  failureCount: integer("failure_count").default(0),
  lastFailureAt: timestamp("last_failure_at"),
  lastSuccessAt: timestamp("last_success_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_webhook_subs_tenant_enabled").on(table.tenantId, table.isEnabled),
]);

export const webhookDeliveryAttempts = pgTable("webhook_delivery_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => webhookSubscriptions.id),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(5),
  nextAttemptAt: timestamp("next_attempt_at"),
  responseCode: integer("response_code"),
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_webhook_attempts_pending").on(table.status, table.nextAttemptAt),
]);

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  actorId: varchar("actor_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  eventType: text("event_type").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  payload: jsonb("payload").$type<{
    version?: number;
    amount?: number;
    duration?: number;
    stage?: string;
    previousStage?: string;
    source?: string;
    metadata?: Record<string, any>;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_analytics_events_tenant_occurred").on(table.tenantId, table.occurredAt),
  index("idx_analytics_events_entity").on(table.entityType, table.entityId),
]);

export const jobMetricsDaily = pgTable("job_metrics_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  applications: integer("applications").default(0),
  interviews: integer("interviews").default(0),
  offers: integer("offers").default(0),
  hires: integer("hires").default(0),
  avgTimeToScreen: integer("avg_time_to_screen"),
  avgTimeToInterview: integer("avg_time_to_interview"),
  avgTimeToOffer: integer("avg_time_to_offer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_job_metrics_job_date").on(table.jobId, table.date),
]);

export const candidateFunnelSnapshots = pgTable("candidate_funnel_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  jobId: varchar("job_id").references(() => jobs.id),
  date: timestamp("date").notNull(),
  stageCounts: jsonb("stage_counts").$type<Record<string, number>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_funnel_snapshots_tenant_date").on(table.tenantId, table.date),
  index("idx_funnel_snapshots_job_date").on(table.jobId, table.date),
]);

export const timeToHireRecords = pgTable("time_to_hire_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  submittedAt: timestamp("submitted_at").notNull(),
  hiredAt: timestamp("hired_at").notNull(),
  durationDays: integer("duration_days").notNull(),
  source: text("source"),
  stages: jsonb("stages").$type<Array<{
    stage: string;
    enteredAt: string;
    exitedAt?: string;
    duration?: number;
  }>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_time_to_hire_job").on(table.jobId, table.hiredAt),
]);

export const revenueTransactions = pgTable("revenue_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  date: timestamp("date").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  type: text("type").notNull(),
  source: text("source").notNull(),
  planId: text("plan_id"),
  metadata: jsonb("metadata").$type<{
    stripeInvoiceId?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_revenue_trans_tenant_date").on(table.tenantId, table.date),
]);

export const revenueAggregatesMonthly = pgTable("revenue_aggregates_monthly", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  month: timestamp("month").notNull(),
  totalRecurring: integer("total_recurring").default(0),
  totalUsage: integer("total_usage").default(0),
  totalRevenue: integer("total_revenue").default(0),
  planBreakdown: jsonb("plan_breakdown").$type<Record<string, number>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_revenue_agg_tenant_month").on(table.tenantId, table.month),
]);

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
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationDigestQueueSchema = createInsertSchema(notificationDigestQueue).omit({ id: true, createdAt: true });
export const insertNotificationDeliverySchema = createInsertSchema(notificationDeliveries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWebhookSubscriptionSchema = createInsertSchema(webhookSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWebhookDeliveryAttemptSchema = createInsertSchema(webhookDeliveryAttempts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, createdAt: true });
export const insertJobMetricsDailySchema = createInsertSchema(jobMetricsDaily).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCandidateFunnelSnapshotSchema = createInsertSchema(candidateFunnelSnapshots).omit({ id: true, createdAt: true });
export const insertTimeToHireRecordSchema = createInsertSchema(timeToHireRecords).omit({ id: true, createdAt: true });
export const insertRevenueTransactionSchema = createInsertSchema(revenueTransactions).omit({ id: true, createdAt: true });
export const insertRevenueAggregateMonthlySchema = createInsertSchema(revenueAggregatesMonthly).omit({ id: true, createdAt: true, updatedAt: true });

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

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;

export type NotificationDigestQueue = typeof notificationDigestQueue.$inferSelect;
export type InsertNotificationDigestQueue = z.infer<typeof insertNotificationDigestQueueSchema>;

export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type InsertNotificationDelivery = z.infer<typeof insertNotificationDeliverySchema>;

export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = z.infer<typeof insertWebhookSubscriptionSchema>;

export type WebhookDeliveryAttempt = typeof webhookDeliveryAttempts.$inferSelect;
export type InsertWebhookDeliveryAttempt = z.infer<typeof insertWebhookDeliveryAttemptSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type JobMetricsDaily = typeof jobMetricsDaily.$inferSelect;
export type InsertJobMetricsDaily = z.infer<typeof insertJobMetricsDailySchema>;

export type CandidateFunnelSnapshot = typeof candidateFunnelSnapshots.$inferSelect;
export type InsertCandidateFunnelSnapshot = z.infer<typeof insertCandidateFunnelSnapshotSchema>;

export type TimeToHireRecord = typeof timeToHireRecords.$inferSelect;
export type InsertTimeToHireRecord = z.infer<typeof insertTimeToHireRecordSchema>;

export type RevenueTransaction = typeof revenueTransactions.$inferSelect;
export type InsertRevenueTransaction = z.infer<typeof insertRevenueTransactionSchema>;

export type RevenueAggregateMonthly = typeof revenueAggregatesMonthly.$inferSelect;
export type InsertRevenueAggregateMonthly = z.infer<typeof insertRevenueAggregateMonthlySchema>;
