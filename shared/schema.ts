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

// Contact Form Submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, read, replied, archived
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_contact_submissions_status").on(table.status),
  index("idx_contact_submissions_email").on(table.email),
]);

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  status: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  updatedAt: true,
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

// Feature Flags
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  category: text("category").notNull().default("general"), // general, ai, billing, security, experimental
  tenantOverrides: jsonb("tenant_overrides").$type<Record<string, boolean>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_feature_flags_key").on(table.key),
  index("idx_feature_flags_category").on(table.category),
]);

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  action: text("action").notNull(), // user.login, user.logout, tenant.created, job.posted, etc.
  resource: text("resource").notNull(), // user, tenant, job, application, etc.
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_tenant_id").on(table.tenantId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_resource").on(table.resource),
  index("idx_audit_logs_created_at").on(table.createdAt),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  details: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Email Preferences
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  // Notification types
  applicationUpdates: boolean("application_updates").notNull().default(true),
  interviewReminders: boolean("interview_reminders").notNull().default(true),
  newJobMatches: boolean("new_job_matches").notNull().default(true),
  weeklyDigest: boolean("weekly_digest").notNull().default(true),
  marketingEmails: boolean("marketing_emails").notNull().default(false),
  productUpdates: boolean("product_updates").notNull().default(true),
  // Digest frequency: 'realtime' | 'daily' | 'weekly' | 'never'
  digestFrequency: text("digest_frequency").notNull().default("weekly"),
  // Unsubscribe token for one-click unsubscribe
  unsubscribeToken: varchar("unsubscribe_token").notNull().default(sql`gen_random_uuid()`),
  // Global unsubscribe (emergency stop all emails)
  unsubscribedAll: boolean("unsubscribed_all").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  unsubscribeToken: true,
});

export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;

// Email Send Log (for tracking and debugging)
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  toEmail: varchar("to_email").notNull(),
  subject: text("subject").notNull(),
  emailType: text("email_type").notNull(), // welcome, application_status, interview, password_reset, digest, etc.
  status: text("status").notNull().default("sent"), // sent, delivered, opened, clicked, bounced, complained
  messageId: varchar("message_id"), // External provider message ID
  metadata: jsonb("metadata"), // Additional data like job ID, company name, etc.
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
}, (table) => [
  index("idx_email_logs_user_id").on(table.userId),
  index("idx_email_logs_to_email").on(table.toEmail),
  index("idx_email_logs_type").on(table.emailType),
  index("idx_email_logs_status").on(table.status),
]);

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;

// ============================================
// Usage Tracking Tables
// ============================================

// Usage records for tracking feature consumption
export const usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: 'cascade' }),
  featureType: varchar("feature_type", { length: 50 }).notNull(), // job_posting, application, ai_match, ai_test, resume_parse, etc.
  quantity: integer("quantity").notNull().default(1),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional context
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_usage_records_user_id").on(table.userId),
  index("idx_usage_records_tenant_id").on(table.tenantId),
  index("idx_usage_records_feature_type").on(table.featureType),
  index("idx_usage_records_billing_period").on(table.billingPeriodStart, table.billingPeriodEnd),
]);

export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({
  id: true,
  createdAt: true,
});

export type UsageRecord = typeof usageRecords.$inferSelect;
export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;

// Monthly usage aggregates for quick lookups
export const usageAggregates = pgTable("usage_aggregates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: 'cascade' }),
  featureType: varchar("feature_type", { length: 50 }).notNull(),
  periodMonth: varchar("period_month", { length: 7 }).notNull(), // YYYY-MM format
  totalUsage: integer("total_usage").notNull().default(0),
  usageLimit: integer("usage_limit"), // null = unlimited
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (table) => [
  index("idx_usage_aggregates_user_period").on(table.userId, table.periodMonth),
  index("idx_usage_aggregates_tenant_period").on(table.tenantId, table.periodMonth),
]);

export const insertUsageAggregateSchema = createInsertSchema(usageAggregates).omit({
  id: true,
});

export type UsageAggregate = typeof usageAggregates.$inferSelect;
export type InsertUsageAggregate = z.infer<typeof insertUsageAggregateSchema>;

// ============================================
// Advanced Team Permissions Tables (Phase 3.4)
// ============================================

// Permission groups enum for categorizing permissions
export const PERMISSION_GROUPS = {
  JOBS: 'jobs',
  CANDIDATES: 'candidates',
  BILLING: 'billing',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  INTEGRATIONS: 'integrations',
  TEAM: 'team',
} as const;

export type PermissionGroup = typeof PERMISSION_GROUPS[keyof typeof PERMISSION_GROUPS];

// All available permissions in the system
export const PERMISSIONS = {
  // Jobs permissions
  'jobs.view': { group: 'jobs', name: 'View Jobs', description: 'View job listings' },
  'jobs.create': { group: 'jobs', name: 'Create Jobs', description: 'Create new job postings' },
  'jobs.edit': { group: 'jobs', name: 'Edit Jobs', description: 'Edit existing job postings' },
  'jobs.delete': { group: 'jobs', name: 'Delete Jobs', description: 'Delete job postings' },
  'jobs.publish': { group: 'jobs', name: 'Publish Jobs', description: 'Publish jobs to live' },
  'jobs.archive': { group: 'jobs', name: 'Archive Jobs', description: 'Archive job postings' },

  // Candidates permissions
  'candidates.view': { group: 'candidates', name: 'View Candidates', description: 'View candidate profiles' },
  'candidates.search': { group: 'candidates', name: 'Search Candidates', description: 'Search candidate database' },
  'candidates.contact': { group: 'candidates', name: 'Contact Candidates', description: 'Send messages to candidates' },
  'candidates.rate': { group: 'candidates', name: 'Rate Candidates', description: 'Rate and score candidates' },
  'candidates.note': { group: 'candidates', name: 'Add Notes', description: 'Add notes to candidate profiles' },
  'candidates.move_stage': { group: 'candidates', name: 'Move Stage', description: 'Move candidates through pipeline stages' },
  'candidates.offer': { group: 'candidates', name: 'Make Offers', description: 'Create and send job offers' },
  'candidates.reject': { group: 'candidates', name: 'Reject Candidates', description: 'Reject candidate applications' },

  // Billing permissions
  'billing.view': { group: 'billing', name: 'View Billing', description: 'View billing information' },
  'billing.manage': { group: 'billing', name: 'Manage Billing', description: 'Update payment methods and plans' },
  'billing.invoices': { group: 'billing', name: 'View Invoices', description: 'View and download invoices' },
  'billing.upgrade': { group: 'billing', name: 'Upgrade Plan', description: 'Change subscription plans' },

  // Settings permissions
  'settings.view': { group: 'settings', name: 'View Settings', description: 'View company settings' },
  'settings.edit': { group: 'settings', name: 'Edit Settings', description: 'Modify company settings' },
  'settings.branding': { group: 'settings', name: 'Manage Branding', description: 'Update company branding' },

  // Team permissions
  'team.view': { group: 'team', name: 'View Team', description: 'View team members' },
  'team.invite': { group: 'team', name: 'Invite Members', description: 'Invite new team members' },
  'team.remove': { group: 'team', name: 'Remove Members', description: 'Remove team members' },
  'team.roles': { group: 'team', name: 'Manage Roles', description: 'Create and manage custom roles' },
  'team.permissions': { group: 'team', name: 'Manage Permissions', description: 'Assign permissions to roles' },

  // Analytics permissions
  'analytics.view': { group: 'analytics', name: 'View Analytics', description: 'View analytics dashboards' },
  'analytics.export': { group: 'analytics', name: 'Export Data', description: 'Export analytics data' },
  'analytics.reports': { group: 'analytics', name: 'Generate Reports', description: 'Create custom reports' },

  // Integrations permissions
  'integrations.view': { group: 'integrations', name: 'View Integrations', description: 'View connected integrations' },
  'integrations.manage': { group: 'integrations', name: 'Manage Integrations', description: 'Connect and configure integrations' },
  'integrations.webhooks': { group: 'integrations', name: 'Manage Webhooks', description: 'Configure webhook endpoints' },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

// Predefined system roles with their permissions
export const SYSTEM_ROLES = {
  owner: {
    name: 'Owner',
    description: 'Full access to everything. Cannot be deleted or modified.',
    permissions: Object.keys(PERMISSIONS) as PermissionKey[],
    isSystem: true,
  },
  admin: {
    name: 'Admin',
    description: 'Can manage team and settings, but not billing.',
    permissions: Object.keys(PERMISSIONS).filter(p => !p.startsWith('billing.manage') && !p.startsWith('billing.upgrade')) as PermissionKey[],
    isSystem: true,
  },
  hiring_manager: {
    name: 'Hiring Manager',
    description: 'Manages hiring process for their department.',
    permissions: [
      'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.publish', 'jobs.archive',
      'candidates.view', 'candidates.search', 'candidates.contact', 'candidates.rate',
      'candidates.note', 'candidates.move_stage', 'candidates.offer', 'candidates.reject',
      'analytics.view', 'team.view',
    ] as PermissionKey[],
    isSystem: true,
  },
  recruiter: {
    name: 'Recruiter',
    description: 'Sources and screens candidates.',
    permissions: [
      'jobs.view',
      'candidates.view', 'candidates.search', 'candidates.contact',
      'candidates.note', 'candidates.rate',
      'analytics.view',
    ] as PermissionKey[],
    isSystem: true,
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to view jobs and candidates.',
    permissions: [
      'jobs.view', 'candidates.view', 'analytics.view', 'team.view',
    ] as PermissionKey[],
    isSystem: true,
  },
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;

// Departments table for department-level access control
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"), // Self-reference for nested departments
  managerId: varchar("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_departments_tenant_id").on(table.tenantId),
  index("idx_departments_parent_id").on(table.parentId),
]);

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

// Team roles table for custom role definitions
export const teamRoles = pgTable("team_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions").array().notNull().default(sql`'{}'::text[]`), // Array of permission keys
  isSystemRole: boolean("is_system_role").notNull().default(false),
  systemRoleKey: text("system_role_key"), // Links to SYSTEM_ROLES if isSystemRole=true
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_team_roles_tenant_id").on(table.tenantId),
  index("idx_team_roles_system").on(table.isSystemRole),
]);

export const insertTeamRoleSchema = createInsertSchema(teamRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamRole = typeof teamRoles.$inferSelect;
export type InsertTeamRole = z.infer<typeof insertTeamRoleSchema>;

// Team member assignments - assigns roles and departments to users
export const teamMemberRoles = pgTable("team_member_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  teamRoleId: varchar("team_role_id").notNull().references(() => teamRoles.id, { onDelete: 'cascade' }),
  departmentId: varchar("department_id").references(() => departments.id, { onDelete: 'set null' }),
  assignedBy: varchar("assigned_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_team_member_roles_user_id").on(table.userId),
  index("idx_team_member_roles_tenant_id").on(table.tenantId),
  index("idx_team_member_roles_role_id").on(table.teamRoleId),
  index("idx_team_member_roles_department_id").on(table.departmentId),
]);

export const insertTeamMemberRoleSchema = createInsertSchema(teamMemberRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamMemberRole = typeof teamMemberRoles.$inferSelect;
export type InsertTeamMemberRole = z.infer<typeof insertTeamMemberRoleSchema>;

// Permission audit logs - tracks all permission-related changes
export const permissionAuditLogs = pgTable("permission_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  actorId: varchar("actor_id").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").references(() => users.id), // User whose permissions were changed
  action: text("action").notNull(), // role.create, role.update, role.delete, member.assign_role, member.remove_role, department.create, etc.
  entityType: text("entity_type").notNull(), // team_role, team_member_role, department
  entityId: varchar("entity_id").notNull(),
  oldValue: jsonb("old_value").$type<Record<string, any>>(),
  newValue: jsonb("new_value").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_permission_audit_logs_tenant_id").on(table.tenantId),
  index("idx_permission_audit_logs_actor_id").on(table.actorId),
  index("idx_permission_audit_logs_target_user_id").on(table.targetUserId),
  index("idx_permission_audit_logs_action").on(table.action),
  index("idx_permission_audit_logs_created_at").on(table.createdAt),
]);

export const insertPermissionAuditLogSchema = createInsertSchema(permissionAuditLogs).omit({
  id: true,
  createdAt: true,
});

export type PermissionAuditLog = typeof permissionAuditLogs.$inferSelect;
export type InsertPermissionAuditLog = z.infer<typeof insertPermissionAuditLogSchema>;

// Update team invitations to include team role reference
export const teamInvitationsWithRole = pgTable("team_invitations_v2", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  email: text("email").notNull(),
  teamRoleId: varchar("team_role_id").references(() => teamRoles.id), // New: reference to team role
  departmentId: varchar("department_id").references(() => departments.id), // New: optional department assignment
  status: text("status").notNull().default("pending"),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_team_invitations_v2_tenant_id").on(table.tenantId),
  index("idx_team_invitations_v2_email").on(table.email),
  index("idx_team_invitations_v2_status").on(table.status),
]);

export const insertTeamInvitationV2Schema = createInsertSchema(teamInvitationsWithRole).omit({
  id: true,
  createdAt: true,
});

export type TeamInvitationV2 = typeof teamInvitationsWithRole.$inferSelect;
export type InsertTeamInvitationV2 = z.infer<typeof insertTeamInvitationV2Schema>;

// ============================================
// Phase 3.5: API Rate Limiting & Monetization
// ============================================

// Subscription Tiers - Define different pricing/feature tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    description: "Basic access for small teams",
    monthlyPrice: 0,
    yearlyPrice: 0,
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    },
    features: {
      maxApiKeys: 1,
      maxTeamMembers: 3,
      maxJobPosts: 5,
      webhooksEnabled: false,
      analyticsRetentionDays: 7,
      prioritySupport: false,
    },
  },
  starter: {
    name: "Starter",
    description: "For growing teams",
    monthlyPrice: 4900, // $49.00 in cents
    yearlyPrice: 47000, // $470.00 in cents (2 months free)
    rateLimits: {
      requestsPerMinute: 300,
      requestsPerHour: 5000,
      requestsPerDay: 50000,
    },
    features: {
      maxApiKeys: 5,
      maxTeamMembers: 10,
      maxJobPosts: 25,
      webhooksEnabled: true,
      analyticsRetentionDays: 30,
      prioritySupport: false,
    },
  },
  professional: {
    name: "Professional",
    description: "For established businesses",
    monthlyPrice: 14900, // $149.00
    yearlyPrice: 143000, // $1,430.00
    rateLimits: {
      requestsPerMinute: 1000,
      requestsPerHour: 20000,
      requestsPerDay: 200000,
    },
    features: {
      maxApiKeys: 20,
      maxTeamMembers: 50,
      maxJobPosts: 100,
      webhooksEnabled: true,
      analyticsRetentionDays: 90,
      prioritySupport: true,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    monthlyPrice: 49900, // $499.00
    yearlyPrice: 479000, // $4,790.00
    rateLimits: {
      requestsPerMinute: 5000,
      requestsPerHour: 100000,
      requestsPerDay: 1000000,
    },
    features: {
      maxApiKeys: 100,
      maxTeamMembers: -1, // Unlimited
      maxJobPosts: -1, // Unlimited
      webhooksEnabled: true,
      analyticsRetentionDays: 365,
      prioritySupport: true,
    },
  },
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;

// Tenant Subscriptions - Track which tier each tenant is on
export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id).unique(),
  tier: text("tier").notNull().default("free"), // free, starter, professional, enterprise
  status: text("status").notNull().default("active"), // active, past_due, canceled, trialing
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  billingCycle: text("billing_cycle").default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  // Custom rate limit overrides (for enterprise customers)
  customRateLimitPerMinute: integer("custom_rate_limit_per_minute"),
  customRateLimitPerHour: integer("custom_rate_limit_per_hour"),
  customRateLimitPerDay: integer("custom_rate_limit_per_day"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_tenant_subscriptions_tenant_id").on(table.tenantId),
  index("idx_tenant_subscriptions_stripe_customer_id").on(table.stripeCustomerId),
]);

export const insertTenantSubscriptionSchema = createInsertSchema(tenantSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantSubscription = typeof tenantSubscriptions.$inferSelect;
export type InsertTenantSubscription = z.infer<typeof insertTenantSubscriptionSchema>;

// API Keys - For external API access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").notNull().references(() => users.id), // Who created the key
  name: text("name").notNull(), // Human-readable name
  keyPrefix: varchar("key_prefix", { length: 8 }).notNull(), // First 8 chars for identification (e.g., "sk_live_")
  keyHash: text("key_hash").notNull(), // Hashed API key
  lastFour: varchar("last_four", { length: 4 }).notNull(), // Last 4 chars for display
  scopes: text("scopes").array().notNull().default(sql`ARRAY[]::text[]`), // Permissions: ["jobs:read", "candidates:read", etc.]
  environment: text("environment").notNull().default("live"), // live, test
  expiresAt: timestamp("expires_at"), // Optional expiration
  lastUsedAt: timestamp("last_used_at"),
  lastUsedIp: varchar("last_used_ip", { length: 45 }),
  isActive: boolean("is_active").notNull().default(true),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id),
  revokedReason: text("revoked_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_api_keys_tenant_id").on(table.tenantId),
  index("idx_api_keys_key_prefix").on(table.keyPrefix),
  index("idx_api_keys_is_active").on(table.isActive),
]);

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// API Key Scopes - Available scopes for API keys
export const API_KEY_SCOPES = {
  // Jobs
  "jobs:read": { name: "Read Jobs", description: "View job listings" },
  "jobs:write": { name: "Write Jobs", description: "Create and update job listings" },
  "jobs:delete": { name: "Delete Jobs", description: "Delete job listings" },
  // Candidates
  "candidates:read": { name: "Read Candidates", description: "View candidate profiles" },
  "candidates:write": { name: "Write Candidates", description: "Update candidate information" },
  "candidates:contact": { name: "Contact Candidates", description: "Send messages to candidates" },
  // Applications
  "applications:read": { name: "Read Applications", description: "View job applications" },
  "applications:write": { name: "Write Applications", description: "Update application status" },
  // Analytics
  "analytics:read": { name: "Read Analytics", description: "View analytics and reports" },
  // Webhooks
  "webhooks:read": { name: "Read Webhooks", description: "View webhook configurations" },
  "webhooks:write": { name: "Write Webhooks", description: "Manage webhook configurations" },
  // Team
  "team:read": { name: "Read Team", description: "View team members" },
  "team:write": { name: "Write Team", description: "Manage team members" },
} as const;

export type ApiKeyScope = keyof typeof API_KEY_SCOPES;

// API Usage Tracking - Hourly aggregates
export const apiUsageHourly = pgTable("api_usage_hourly", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id), // null if using session auth
  hourTimestamp: timestamp("hour_timestamp").notNull(), // Truncated to hour
  endpoint: text("endpoint").notNull(), // API endpoint path pattern
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, etc.
  requestCount: integer("request_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  rateLimitedCount: integer("rate_limited_count").notNull().default(0),
  totalResponseTimeMs: integer("total_response_time_ms").notNull().default(0), // For calculating avg
  avgResponseTimeMs: integer("avg_response_time_ms"), // Calculated on aggregation
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_api_usage_hourly_tenant_id").on(table.tenantId),
  index("idx_api_usage_hourly_api_key_id").on(table.apiKeyId),
  index("idx_api_usage_hourly_hour_timestamp").on(table.hourTimestamp),
  index("idx_api_usage_hourly_tenant_hour").on(table.tenantId, table.hourTimestamp),
]);

export const insertApiUsageHourlySchema = createInsertSchema(apiUsageHourly).omit({
  id: true,
  createdAt: true,
});

export type ApiUsageHourly = typeof apiUsageHourly.$inferSelect;
export type InsertApiUsageHourly = z.infer<typeof insertApiUsageHourlySchema>;

// API Usage Daily - Daily aggregates (rolled up from hourly)
export const apiUsageDaily = pgTable("api_usage_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id),
  dateTimestamp: timestamp("date_timestamp").notNull(), // Truncated to day
  totalRequests: integer("total_requests").notNull().default(0),
  totalSuccess: integer("total_success").notNull().default(0),
  totalErrors: integer("total_errors").notNull().default(0),
  totalRateLimited: integer("total_rate_limited").notNull().default(0),
  avgResponseTimeMs: integer("avg_response_time_ms"),
  peakRequestsPerMinute: integer("peak_requests_per_minute"),
  uniqueEndpoints: integer("unique_endpoints"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_api_usage_daily_tenant_id").on(table.tenantId),
  index("idx_api_usage_daily_date_timestamp").on(table.dateTimestamp),
  index("idx_api_usage_daily_tenant_date").on(table.tenantId, table.dateTimestamp),
]);

export const insertApiUsageDailySchema = createInsertSchema(apiUsageDaily).omit({
  id: true,
  createdAt: true,
});

export type ApiUsageDaily = typeof apiUsageDaily.$inferSelect;
export type InsertApiUsageDaily = z.infer<typeof insertApiUsageDailySchema>;

// Rate Limit Events - Track rate limit hits for monitoring
export const rateLimitEvents = pgTable("rate_limit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id),
  userId: varchar("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  limitType: text("limit_type").notNull(), // per_minute, per_hour, per_day
  limitValue: integer("limit_value").notNull(), // The limit that was hit
  currentCount: integer("current_count").notNull(), // Current count when limited
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_rate_limit_events_tenant_id").on(table.tenantId),
  index("idx_rate_limit_events_created_at").on(table.createdAt),
]);

export const insertRateLimitEventSchema = createInsertSchema(rateLimitEvents).omit({
  id: true,
  createdAt: true,
});

export type RateLimitEvent = typeof rateLimitEvents.$inferSelect;
export type InsertRateLimitEvent = z.infer<typeof insertRateLimitEventSchema>;

// ============================================================================
// Phase 3.1: SSO/SAML Integration
// ============================================================================

// SSO Provider Types
export const SSO_PROVIDERS = {
  saml: { name: 'SAML 2.0', description: 'Generic SAML 2.0 Identity Provider' },
  okta: { name: 'Okta', description: 'Okta Identity Provider' },
  azure_ad: { name: 'Azure AD', description: 'Microsoft Azure Active Directory' },
  google_workspace: { name: 'Google Workspace', description: 'Google Workspace SSO' },
} as const;

export type SSOProviderType = keyof typeof SSO_PROVIDERS;

// Tenant SSO Configurations
export const tenantSSOConfigs = pgTable("tenant_sso_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  providerType: text("provider_type").notNull(), // saml, okta, azure_ad, google_workspace
  enabled: boolean("enabled").notNull().default(false),
  enforced: boolean("enforced").notNull().default(false), // Require SSO for all users
  allowFallback: boolean("allow_fallback").notNull().default(true), // Allow email/password login

  // SAML Configuration
  entityId: text("entity_id"), // Service Provider Entity ID
  ssoUrl: text("sso_url"), // IdP SSO URL
  sloUrl: text("slo_url"), // IdP Single Logout URL
  idpCertificate: text("idp_certificate"), // IdP X.509 Certificate
  spCertificate: text("sp_certificate"), // Service Provider Certificate
  spPrivateKey: text("sp_private_key"), // Service Provider Private Key (encrypted)
  metadataUrl: text("metadata_url"), // IdP Metadata URL

  // Attribute Mapping
  attributeMapping: jsonb("attribute_mapping").$type<{
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    department?: string;
    groups?: string;
  }>().default({}),

  // JIT Provisioning Settings
  jitEnabled: boolean("jit_enabled").notNull().default(true), // Just-In-Time user creation
  jitDefaultRole: text("jit_default_role").default("viewer"), // Default role for new users
  jitAutoDepartment: boolean("jit_auto_department").notNull().default(false),

  // Provider-specific settings
  providerSettings: jsonb("provider_settings").$type<{
    oktaDomain?: string;
    azureTenantId?: string;
    googleDomain?: string;
    customLogoutUrl?: string;
  }>().default({}),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_tenant_sso_configs_tenant_id").on(table.tenantId),
]);

export const insertTenantSSOConfigSchema = createInsertSchema(tenantSSOConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantSSOConfig = typeof tenantSSOConfigs.$inferSelect;
export type InsertTenantSSOConfig = z.infer<typeof insertTenantSSOConfigSchema>;

// SSO Sessions - Track SSO login sessions
export const ssoSessions = pgTable("sso_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  ssoConfigId: varchar("sso_config_id").notNull().references(() => tenantSSOConfigs.id),
  sessionIndex: text("session_index"), // SAML SessionIndex
  nameId: text("name_id"), // SAML NameID
  nameIdFormat: text("name_id_format"),
  attributes: jsonb("attributes").$type<Record<string, string | string[]>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_sso_sessions_user_id").on(table.userId),
  index("idx_sso_sessions_session_index").on(table.sessionIndex),
]);

export type SSOSession = typeof ssoSessions.$inferSelect;

// SSO Audit Log - Track SSO-related events
export const ssoAuditLogs = pgTable("sso_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  ssoConfigId: varchar("sso_config_id").references(() => tenantSSOConfigs.id),
  eventType: text("event_type").notNull(), // login_success, login_failure, logout, config_change, jit_provision
  eventDetails: jsonb("event_details").$type<{
    errorCode?: string;
    errorMessage?: string;
    provisionedUser?: string;
    oldConfig?: Record<string, any>;
    newConfig?: Record<string, any>;
    samlResponse?: string; // Truncated for debugging
  }>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_sso_audit_logs_tenant_id").on(table.tenantId),
  index("idx_sso_audit_logs_created_at").on(table.createdAt),
]);

export type SSOAuditLog = typeof ssoAuditLogs.$inferSelect;

// ============================================================================
// Phase 3.2: Per-Tenant Branding
// ============================================================================

// Tenant Branding Configuration
export const tenantBranding = pgTable("tenant_branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id).unique(),

  // Logo & Images
  logoUrl: text("logo_url"),
  logoLightUrl: text("logo_light_url"), // For dark backgrounds
  faviconUrl: text("favicon_url"),
  loginBackgroundUrl: text("login_background_url"),

  // Colors (CSS hex values)
  primaryColor: varchar("primary_color", { length: 7 }).default("#6366f1"), // Primary brand color
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#8b5cf6"),
  accentColor: varchar("accent_color", { length: 7 }).default("#06b6d4"),
  backgroundColor: varchar("background_color", { length: 7 }).default("#ffffff"),
  textColor: varchar("text_color", { length: 7 }).default("#1f2937"),

  // Typography
  fontFamily: text("font_family").default("Inter, system-ui, sans-serif"),
  headingFontFamily: text("heading_font_family"),

  // Custom Domain
  customDomain: text("custom_domain"),
  customDomainVerified: boolean("custom_domain_verified").default(false),
  customDomainVerificationToken: text("custom_domain_verification_token"),

  // Content Customization
  companyName: text("company_name"),
  tagline: text("tagline"),
  supportEmail: text("support_email"),
  supportUrl: text("support_url"),
  privacyPolicyUrl: text("privacy_policy_url"),
  termsOfServiceUrl: text("terms_of_service_url"),

  // Custom Footer/Header
  headerHtml: text("header_html"),
  footerHtml: text("footer_html"),
  customCss: text("custom_css"), // Additional CSS overrides

  // Email Branding
  emailFromName: text("email_from_name"),
  emailFooterHtml: text("email_footer_html"),
  emailHeaderHtml: text("email_header_html"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_tenant_branding_tenant_id").on(table.tenantId),
  index("idx_tenant_branding_custom_domain").on(table.customDomain),
]);

export const insertTenantBrandingSchema = createInsertSchema(tenantBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantBranding = typeof tenantBranding.$inferSelect;
export type InsertTenantBranding = z.infer<typeof insertTenantBrandingSchema>;

// ============================================================================
// Phase 3.3: ATS Integrations
// ============================================================================

// Supported ATS Providers
export const ATS_PROVIDERS = {
  greenhouse: { name: 'Greenhouse', description: 'Greenhouse Recruiting', apiBaseUrl: 'https://harvest.greenhouse.io/v1' },
  lever: { name: 'Lever', description: 'Lever Hiring', apiBaseUrl: 'https://api.lever.co/v1' },
  workday: { name: 'Workday', description: 'Workday Recruiting', apiBaseUrl: '' }, // Dynamic per tenant
  ashby: { name: 'Ashby', description: 'Ashby ATS', apiBaseUrl: 'https://api.ashbyhq.com' },
  bamboohr: { name: 'BambooHR', description: 'BambooHR', apiBaseUrl: 'https://api.bamboohr.com/api/gateway.php' },
} as const;

export type ATSProviderType = keyof typeof ATS_PROVIDERS;

// ATS Sync Status
export const ATS_SYNC_STATUS = {
  pending: 'Pending',
  syncing: 'Syncing',
  completed: 'Completed',
  failed: 'Failed',
  partial: 'Partial',
} as const;

// ATS Integration Connections
export const atsConnections = pgTable("ats_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  provider: text("provider").notNull(), // greenhouse, lever, workday, etc.
  name: text("name").notNull(), // User-friendly name for the connection
  enabled: boolean("enabled").notNull().default(true),

  // Authentication
  apiKey: text("api_key"), // Encrypted API key
  apiSecret: text("api_secret"), // Encrypted API secret (if needed)
  accessToken: text("access_token"), // OAuth access token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"),

  // Provider-specific settings
  providerConfig: jsonb("provider_config").$type<{
    subdomain?: string; // For providers like BambooHR
    webhookSecret?: string;
    syncSettings?: {
      syncJobs?: boolean;
      syncCandidates?: boolean;
      syncInterviews?: boolean;
      syncOffers?: boolean;
    };
  }>().default({}),

  // Sync Status
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status").default("pending"),
  lastSyncError: text("last_sync_error"),
  syncFrequency: text("sync_frequency").default("hourly"), // manual, hourly, daily, realtime

  // Webhook Configuration
  webhookUrl: text("webhook_url"),
  webhookEnabled: boolean("webhook_enabled").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ats_connections_tenant_id").on(table.tenantId),
  index("idx_ats_connections_provider").on(table.provider),
]);

export const insertATSConnectionSchema = createInsertSchema(atsConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ATSConnection = typeof atsConnections.$inferSelect;
export type InsertATSConnection = z.infer<typeof insertATSConnectionSchema>;

// ATS Entity Mappings - Map local entities to ATS entities
export const atsEntityMappings = pgTable("ats_entity_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => atsConnections.id),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  entityType: text("entity_type").notNull(), // job, candidate, application, interview
  localId: varchar("local_id").notNull(), // Our internal ID
  remoteId: varchar("remote_id").notNull(), // ATS ID
  remoteData: jsonb("remote_data").$type<Record<string, any>>(), // Cached remote data
  lastSyncedAt: timestamp("last_synced_at"),
  syncDirection: text("sync_direction").default("bidirectional"), // inbound, outbound, bidirectional
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ats_entity_mappings_connection_id").on(table.connectionId),
  index("idx_ats_entity_mappings_local_id").on(table.localId),
  index("idx_ats_entity_mappings_remote_id").on(table.remoteId),
]);

export type ATSEntityMapping = typeof atsEntityMappings.$inferSelect;

// ATS Sync Logs - Track sync operations
export const atsSyncLogs = pgTable("ats_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => atsConnections.id),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  syncType: text("sync_type").notNull(), // full, incremental, webhook
  entityType: text("entity_type"), // jobs, candidates, applications, etc.
  status: text("status").notNull(), // pending, running, completed, failed
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsFailed: integer("records_failed").default(0),
  errorDetails: jsonb("error_details").$type<Array<{ entity: string; error: string }>>(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ats_sync_logs_connection_id").on(table.connectionId),
  index("idx_ats_sync_logs_created_at").on(table.createdAt),
]);

export type ATSSyncLog = typeof atsSyncLogs.$inferSelect;

// ATS Webhooks - Incoming webhook events
export const atsWebhooks = pgTable("ats_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => atsConnections.id),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  eventType: text("event_type").notNull(), // candidate_created, job_updated, etc.
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // pending, processed, failed
  processedAt: timestamp("processed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ats_webhooks_connection_id").on(table.connectionId),
  index("idx_ats_webhooks_status").on(table.status),
]);

export type ATSWebhook = typeof atsWebhooks.$inferSelect;

// ============================================================================
// Phase 3.6: Multi-Region Infrastructure
// ============================================================================

// Available Regions
export const DATA_REGIONS = {
  us_east: { name: 'US East', code: 'us-east-1', location: 'Virginia, USA', flag: '🇺🇸' },
  us_west: { name: 'US West', code: 'us-west-2', location: 'Oregon, USA', flag: '🇺🇸' },
  eu_west: { name: 'EU West', code: 'eu-west-1', location: 'Ireland', flag: '🇪🇺' },
  eu_central: { name: 'EU Central', code: 'eu-central-1', location: 'Frankfurt, Germany', flag: '🇩🇪' },
  ap_southeast: { name: 'Asia Pacific', code: 'ap-southeast-1', location: 'Singapore', flag: '🇸🇬' },
  ap_northeast: { name: 'Asia Pacific', code: 'ap-northeast-1', location: 'Tokyo, Japan', flag: '🇯🇵' },
} as const;

export type DataRegion = keyof typeof DATA_REGIONS;

// Tenant Region Configuration
export const tenantRegionConfigs = pgTable("tenant_region_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id).unique(),

  // Primary Region Settings
  primaryRegion: text("primary_region").notNull().default("us_east"),
  dataResidency: text("data_residency"), // Required data residency region (for compliance)

  // CDN & Edge Settings
  cdnEnabled: boolean("cdn_enabled").notNull().default(true),
  edgeCachingEnabled: boolean("edge_caching_enabled").notNull().default(true),

  // Failover Settings
  failoverEnabled: boolean("failover_enabled").notNull().default(false),
  failoverRegion: text("failover_region"),
  autoFailover: boolean("auto_failover").notNull().default(false),

  // Compliance & Legal
  gdprCompliant: boolean("gdpr_compliant").notNull().default(false),
  hipaaCompliant: boolean("hipaa_compliant").notNull().default(false),
  dataProcessingAgreementSigned: boolean("dpa_signed").notNull().default(false),

  // Migration Status (for region changes)
  migrationStatus: text("migration_status"), // null, pending, in_progress, completed
  migrationStartedAt: timestamp("migration_started_at"),
  migrationCompletedAt: timestamp("migration_completed_at"),
  previousRegion: text("previous_region"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_tenant_region_configs_tenant_id").on(table.tenantId),
  index("idx_tenant_region_configs_primary_region").on(table.primaryRegion),
]);

export const insertTenantRegionConfigSchema = createInsertSchema(tenantRegionConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantRegionConfig = typeof tenantRegionConfigs.$inferSelect;
export type InsertTenantRegionConfig = z.infer<typeof insertTenantRegionConfigSchema>;

// Region Health Status - Track region availability
export const regionHealthStatus = pgTable("region_health_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: text("region").notNull(),
  status: text("status").notNull().default("healthy"), // healthy, degraded, unhealthy
  latencyMs: integer("latency_ms"),
  lastCheckedAt: timestamp("last_checked_at").notNull().defaultNow(),
  errorCount: integer("error_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_region_health_status_region").on(table.region),
  index("idx_region_health_status_checked_at").on(table.lastCheckedAt),
]);

export type RegionHealthStatus = typeof regionHealthStatus.$inferSelect;
