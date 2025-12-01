import { Job } from 'bullmq';
import {
  registerWorker,
  ResumeParseJobData,
  BatchMatchingJobData,
  EmailJobData,
  AnalyticsJobData,
  WebhookJobData,
  NotificationJobData,
  isRedisAvailable,
} from './jobQueue';
import { storage } from './storage';
import { emailService } from './emailService';
import { matchingService } from './matchingService';
import { aiService } from './aiService';

// Resume Parsing Job Processor
async function processResumeParse(job: Job<ResumeParseJobData>) {
  const { userId, resumeUrl, fileName } = job.data;

  await job.updateProgress(10);
  console.log(`[RESUME PARSE] Starting parse for user ${userId}, file: ${fileName}`);

  try {
    // In a real implementation, this would:
    // 1. Download the resume from resumeUrl
    // 2. Use a PDF/DOCX parser to extract text
    // 3. Use AI to extract structured data (skills, experience, education)
    // 4. Store the parsed data in the database

    await job.updateProgress(30);

    // Simulate parsing (replace with actual implementation)
    const parsedData = await aiService.parseResume(resumeUrl);

    await job.updateProgress(70);

    // Update job seeker profile with parsed data - getJobSeeker takes userId
    const jobSeeker = await storage.getJobSeeker(userId);
    if (jobSeeker && parsedData) {
      await storage.updateJobSeeker(jobSeeker.id, {
        skills: parsedData.skills || jobSeeker.skills,
        experience: parsedData.experience || jobSeeker.experience,
      });
    }

    await job.updateProgress(100);

    return { success: true, parsedData };
  } catch (error) {
    console.error(`[RESUME PARSE] Failed for user ${userId}:`, error);
    throw error;
  }
}

// Batch Matching Job Processor
async function processBatchMatching(job: Job<BatchMatchingJobData>) {
  const { jobId, candidateId, tenantId } = job.data;

  await job.updateProgress(10);
  console.log(`[BATCH MATCHING] Starting for tenant ${tenantId}`);

  try {
    let matchResults: Array<{ candidateId: string; jobId: string; score: number }> = [];

    if (jobId) {
      // Match all candidates to a specific job
      const jobPosting = await storage.getJobById(jobId);
      if (!jobPosting) throw new Error(`Job ${jobId} not found`);

      // Get all job seekers (getJobs takes optional employerId)
      const allJobs = await storage.getJobs();
      await job.updateProgress(30);

      // For now, just log that batch matching was triggered
      // Full implementation would iterate through candidates
      console.log(`[BATCH MATCHING] Would match ${allJobs.length} jobs to candidates`);
    } else if (candidateId) {
      // Match a specific candidate to all jobs
      const candidate = await storage.getJobSeekerById(candidateId);
      if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

      const jobs = await storage.getJobs();
      await job.updateProgress(30);

      for (let i = 0; i < jobs.length; i++) {
        const jobPosting = jobs[i];

        // Use the matching service to get full match result
        const matchResult = await matchingService.analyzeEnhancedMatch(candidate, jobPosting);

        if (matchResult.matchScore >= 50) {
          matchResults.push({ candidateId, jobId: jobPosting.id, score: matchResult.matchScore });

          await storage.createMatch({
            jobSeekerId: candidateId,
            jobId: jobPosting.id,
            matchScore: matchResult.matchScore,
            explanation: `AI-powered match based on skills alignment (${matchResult.matchingSkills.length} matching skills)`,
            matchingSkills: matchResult.matchingSkills,
            gapSkills: matchResult.gapSkills,
          });
        }

        await job.updateProgress(30 + Math.floor((i / jobs.length) * 60));
      }
    }

    await job.updateProgress(100);

    console.log(`[BATCH MATCHING] Completed with ${matchResults.length} matches`);
    return { success: true, matchCount: matchResults.length, matches: matchResults };
  } catch (error) {
    console.error(`[BATCH MATCHING] Failed:`, error);
    throw error;
  }
}

// Email Sending Job Processor
async function processEmailSend(job: Job<EmailJobData>) {
  const { to, subject, html, text, emailType, userId, metadata } = job.data;

  console.log(`[EMAIL SEND] Sending ${emailType} email to ${to}`);

  try {
    const result = await emailService.sendEmail({ to, subject, html, text });

    // Log the email
    await storage.createEmailLog({
      userId: userId || null,
      toEmail: to,
      subject,
      emailType,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      metadata: metadata as Record<string, unknown>,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`[EMAIL SEND] Failed to send to ${to}:`, error);

    // Log failure
    await storage.createEmailLog({
      userId: userId || null,
      toEmail: to,
      subject,
      emailType,
      status: 'failed',
      metadata: { error: (error as Error).message, ...metadata },
    });

    throw error;
  }
}

// Analytics Aggregation Job Processor
async function processAnalyticsAggregation(job: Job<AnalyticsJobData>) {
  const { tenantId, period, metrics } = job.data;

  await job.updateProgress(10);
  console.log(`[ANALYTICS] Aggregating ${period} analytics for tenant ${tenantId || 'all'}`);

  try {
    const results: Record<string, unknown> = {};
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    await job.updateProgress(20);

    // Aggregate different metrics
    for (const metric of metrics) {
      switch (metric) {
        case 'applications':
          // Count applications in period
          results.applications = await storage.getApplicationCount({ startDate, tenantId });
          break;
        case 'jobs':
          // Count jobs posted in period
          results.jobs = await storage.getJobCount({ startDate, tenantId });
          break;
        case 'users':
          // Count new users in period
          results.users = await storage.getUserCount({ startDate });
          break;
        case 'matches':
          // Count matches created in period
          results.matches = await storage.getMatchCount({ startDate, tenantId });
          break;
      }

      await job.updateProgress(20 + Math.floor((metrics.indexOf(metric) / metrics.length) * 70));
    }

    await job.updateProgress(100);

    console.log(`[ANALYTICS] Aggregation complete:`, results);
    return { success: true, period, results };
  } catch (error) {
    console.error(`[ANALYTICS] Aggregation failed:`, error);
    throw error;
  }
}

// Webhook Delivery Job Processor
async function processWebhookDelivery(job: Job<WebhookJobData>) {
  const { url, payload, tenantId, eventType, signature } = job.data;

  console.log(`[WEBHOOK] Delivering ${eventType} event to ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SkillSync-Event': eventType,
        'X-SkillSync-Signature': signature || '',
        'X-SkillSync-Timestamp': Date.now().toString(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
    }

    console.log(`[WEBHOOK] Successfully delivered to ${url}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error(`[WEBHOOK] Delivery failed to ${url}:`, error);
    throw error;
  }
}

// Notification Job Processor
async function processNotification(job: Job<NotificationJobData>) {
  const { userId, type, title, message, data } = job.data;

  console.log(`[NOTIFICATION] Sending ${type} notification to user ${userId}`);

  try {
    // Create in-app notification
    await storage.createNotification({
      userId,
      type,
      title,
      message,
      metadata: data,
      read: false,
    });

    // Check user preferences for additional channels
    const prefs = await storage.getEmailPreferences(userId);
    const user = await storage.getUser(userId);

    if (user?.email && prefs && !prefs.unsubscribedAll) {
      // Determine if we should send email based on notification type and preferences
      let shouldEmail = false;

      if (type.startsWith('application.') && prefs.applicationUpdates) {
        shouldEmail = true;
      } else if (type.startsWith('interview.') && prefs.interviewReminders) {
        shouldEmail = true;
      } else if (type.startsWith('match.') && prefs.newJobMatches) {
        shouldEmail = true;
      }

      if (shouldEmail) {
        await emailService.sendNotificationEmail(user.email, title, message);
      }
    }

    return { success: true };
  } catch (error) {
    console.error(`[NOTIFICATION] Failed for user ${userId}:`, error);
    throw error;
  }
}

// Initialize all job processors
export function initializeJobProcessors(): void {
  if (!isRedisAvailable()) {
    console.log('[JOB PROCESSORS] Redis not available, skipping worker registration');
    return;
  }

  console.log('[JOB PROCESSORS] Initializing job processors...');

  registerWorker('resume', processResumeParse);
  registerWorker('matching', processBatchMatching);
  registerWorker('email', processEmailSend);
  registerWorker('analytics', processAnalyticsAggregation);
  registerWorker('webhook', processWebhookDelivery);
  registerWorker('notification', processNotification);

  console.log('[JOB PROCESSORS] All processors registered');
}

// Helper to queue an email (with fallback to direct send)
export async function queueEmail(emailData: EmailJobData): Promise<void> {
  const { addJob } = await import('./jobQueue');

  if (isRedisAvailable()) {
    await addJob('email', 'email.send', emailData);
  } else {
    // Fallback: send directly
    await emailService.sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });
  }
}

// Helper to queue a notification
export async function queueNotification(notificationData: NotificationJobData): Promise<void> {
  const { addJob } = await import('./jobQueue');

  if (isRedisAvailable()) {
    await addJob('notification', 'notification.send', notificationData);
  } else {
    // Fallback: create directly
    await processNotification({ data: notificationData } as Job<NotificationJobData>);
  }
}

// Helper to queue batch matching
export async function queueBatchMatching(data: BatchMatchingJobData): Promise<void> {
  const { addJob } = await import('./jobQueue');

  if (isRedisAvailable()) {
    await addJob('matching', 'matching.batch', data);
  } else {
    console.log('[JOB PROCESSORS] Redis not available, batch matching will be skipped');
  }
}

// Helper to queue resume parsing
export async function queueResumeParse(data: ResumeParseJobData): Promise<void> {
  const { addJob } = await import('./jobQueue');

  if (isRedisAvailable()) {
    await addJob('resume', 'resume.parse', data);
  } else {
    console.log('[JOB PROCESSORS] Redis not available, resume parsing will be done synchronously');
    await processResumeParse({ data } as Job<ResumeParseJobData>);
  }
}

// Helper to trigger webhooks for an event
export async function triggerWebhooks(
  tenantId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { addJob } = await import('./jobQueue');
  const { storage } = await import('./storage');
  const crypto = await import('crypto');

  try {
    const subscriptions = await storage.getWebhookSubscriptions(tenantId);
    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.isEnabled && sub.subscribedEvents?.includes(eventType)
    );

    for (const subscription of activeSubscriptions) {
      const webhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      const signature = crypto
        .createHmac('sha256', subscription.secret)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const webhookData: WebhookJobData = {
        url: subscription.endpointUrl,
        payload: webhookPayload,
        tenantId,
        eventType,
        signature: `sha256=${signature}`,
        subscriptionId: subscription.id,
      };

      if (isRedisAvailable()) {
        await addJob('webhook', 'webhook.deliver', webhookData);
      } else {
        // Synchronous fallback
        try {
          await processWebhookDelivery({ data: webhookData } as Job<WebhookJobData>);
          await storage.createWebhookDeliveryAttempt({
            subscriptionId: subscription.id,
            eventType,
            payload: webhookPayload,
            status: 'success',
            attempts: 1,
            deliveredAt: new Date(),
          });
          await storage.updateWebhookSubscription(subscription.id, { lastSuccessAt: new Date() });
        } catch (error: any) {
          await storage.createWebhookDeliveryAttempt({
            subscriptionId: subscription.id,
            eventType,
            payload: webhookPayload,
            status: 'failed',
            attempts: 1,
            errorMessage: error.message,
          });
        }
      }
    }

    console.log(`[WEBHOOKS] Triggered ${activeSubscriptions.length} webhooks for ${eventType}`);
  } catch (error) {
    console.error(`[WEBHOOKS] Error triggering webhooks:`, error);
  }
}

