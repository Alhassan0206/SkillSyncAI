import type { InsertNotification, Notification, Application, Interview, User } from "@shared/schema";
import type { IStorage } from "./storage";
import { SlackService } from "./slackService";

interface NotificationContext {
  userId: string;
  application?: Application;
  interview?: Interview;
  changedBy?: User;
  additionalData?: Record<string, any>;
}

export class NotificationService {
  private slackService: SlackService;

  constructor(private storage: IStorage) {
    this.slackService = new SlackService(storage);
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    return this.storage.createNotification(data);
  }

  async sendApplicationStatusChange(
    context: NotificationContext,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const { userId, application, changedBy } = context;

    const statusMessages: Record<string, { title: string; message: string }> = {
      applied: {
        title: "Application Submitted",
        message: "Your application has been successfully submitted.",
      },
      interview: {
        title: "Interview Scheduled",
        message: "Congratulations! You've been invited for an interview.",
      },
      offer: {
        title: "Job Offer Received",
        message: "Great news! You've received a job offer.",
      },
      hired: {
        title: "Congratulations! You're Hired!",
        message: "Your application has been accepted. Welcome to the team!",
      },
      rejected: {
        title: "Application Update",
        message: "Thank you for your interest. We've decided to move forward with other candidates.",
      },
    };

    const notification = statusMessages[newStatus] || {
      title: "Application Status Updated",
      message: `Your application status has been changed to ${newStatus}`,
    };

    await this.createNotification({
      userId,
      type: "application_status_change",
      title: notification.title,
      message: notification.message,
      relatedEntityType: "application",
      relatedEntityId: application?.id,
      actionUrl: application ? `/dashboard/applications` : undefined,
      metadata: {
        oldStatus,
        newStatus,
        applicationId: application?.id,
        changedBy: changedBy ? `${changedBy.firstName} ${changedBy.lastName}` : undefined,
      },
    });

    if (application && changedBy) {
      try {
        const jobSeeker = await this.storage.getJobSeekerById(application.jobSeekerId);
        if (jobSeeker) {
          const user = await this.storage.getUser(jobSeeker.userId);
          const tenantId = changedBy.tenantId || user?.tenantId;
          
          if (user && tenantId) {
            await this.slackService.sendApplicationStatusNotification(
              tenantId,
              application,
              oldStatus,
              newStatus,
              user,
              changedBy
            );
          }
        }
      } catch (error) {
        console.error("Failed to send Slack notification:", error);
      }
    }
  }

  async sendInterviewScheduled(
    context: NotificationContext
  ): Promise<void> {
    const { userId, interview, application } = context;

    if (!interview) return;

    await this.createNotification({
      userId,
      type: "interview_scheduled",
      title: "New Interview Scheduled",
      message: `Your interview has been scheduled for ${new Date(interview.scheduledAt).toLocaleString()}`,
      relatedEntityType: "interview",
      relatedEntityId: interview.id,
      actionUrl: `/dashboard/applications`,
      metadata: {
        interviewId: interview.id,
        applicationId: application?.id,
        scheduledAt: interview.scheduledAt,
        interviewType: interview.interviewType,
        duration: interview.duration,
      },
    });

    if (application && interview.interviewers && interview.interviewers.length > 0) {
      try {
        const jobSeeker = await this.storage.getJobSeekerById(application.jobSeekerId);
        if (jobSeeker) {
          const user = await this.storage.getUser(jobSeeker.userId);
          const interviewer = await this.storage.getUser(interview.interviewers[0]);
          const tenantId = interviewer?.tenantId || user?.tenantId;
          
          if (user && interviewer && tenantId) {
            await this.slackService.sendInterviewScheduledNotification(
              tenantId,
              interview,
              application,
              user,
              interviewer
            );
          }
        }
      } catch (error) {
        console.error("Failed to send Slack notification:", error);
      }
    }
  }

  async sendInterviewReminder(
    context: NotificationContext
  ): Promise<void> {
    const { userId, interview } = context;

    if (!interview) return;

    await this.createNotification({
      userId,
      type: "interview_reminder",
      title: "Upcoming Interview Reminder",
      message: `Your interview is scheduled for ${new Date(interview.scheduledAt).toLocaleString()}`,
      relatedEntityType: "interview",
      relatedEntityId: interview.id,
      actionUrl: `/dashboard/applications`,
      metadata: {
        interviewId: interview.id,
        scheduledAt: interview.scheduledAt,
        meetingUrl: interview.meetingUrl,
        location: interview.location,
      },
    });
  }

  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    return this.storage.getNotifications(userId, 100, 0);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.storage.markNotificationAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.storage.markAllNotificationsAsRead(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getUserNotifications(userId, true);
    return notifications.length;
  }
}
