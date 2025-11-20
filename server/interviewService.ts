import type { InsertInterview, Interview, Application, User, IntegrationConfig } from "@shared/schema";
import type { IStorage } from "./storage";
import { NotificationService } from "./notificationService";

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  meetingUrl?: string;
}

export interface CalendarIntegration {
  createEvent(event: CalendarEvent): Promise<{ eventId: string; meetingUrl?: string }>;
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}

export class InterviewService {
  private notificationService: NotificationService;

  constructor(private storage: IStorage) {
    this.notificationService = new NotificationService(storage);
  }

  async scheduleInterview(data: {
    applicationId: string;
    interviewers: string[];
    scheduledAt: Date;
    duration: number;
    interviewType: string;
    location?: string;
    meetingUrl?: string;
    notes?: string;
  }): Promise<Interview> {
    const application = await this.storage.getApplications(undefined, undefined);
    const app = application.find(a => a.id === data.applicationId);
    
    if (!app) {
      throw new Error("Application not found");
    }

    const interview: InsertInterview = {
      applicationId: data.applicationId,
      interviewers: data.interviewers,
      scheduledAt: data.scheduledAt,
      duration: data.duration,
      interviewType: data.interviewType,
      status: "scheduled",
      location: data.location || undefined,
      meetingUrl: data.meetingUrl || undefined,
      notes: data.notes || undefined,
    };

    const created = await this.storage.createInterview(interview);

    await this.notificationService.sendInterviewScheduled({
      userId: app.jobSeekerId,
      interview: created,
      application: app,
    });

    return created;
  }

  async rescheduleInterview(
    interviewId: string,
    newScheduledAt: Date,
    updatedBy: string
  ): Promise<Interview> {
    const interview = await this.storage.getInterviewById(interviewId);
    
    if (!interview) {
      throw new Error("Interview not found");
    }

    const updated = await this.storage.updateInterview(interviewId, {
      scheduledAt: newScheduledAt,
    });

    const application = await this.storage.getApplications(undefined, undefined);
    const app = application.find(a => a.id === interview.applicationId);

    if (app) {
      await this.notificationService.sendInterviewScheduled({
        userId: app.jobSeekerId,
        interview: updated,
        application: app,
      });
    }

    return updated;
  }

  async cancelInterview(interviewId: string): Promise<void> {
    const interview = await this.storage.getInterviewById(interviewId);
    
    if (!interview) {
      throw new Error("Interview not found");
    }

    await this.storage.updateInterview(interviewId, {
      status: "cancelled",
    });

    const application = await this.storage.getApplications(undefined, undefined);
    const app = application.find(a => a.id === interview.applicationId);

    if (app) {
      await this.notificationService.createNotification({
        userId: app.jobSeekerId,
        type: "interview_cancelled",
        title: "Interview Cancelled",
        message: "Your interview has been cancelled",
        relatedEntityType: "interview",
        relatedEntityId: interviewId,
      });
    }
  }

  async completeInterview(
    interviewId: string,
    feedbackData?: {
      rating?: number;
      comments?: string;
      strengths?: string;
      concerns?: string;
    }
  ): Promise<Interview> {
    const updated = await this.storage.updateInterview(interviewId, {
      status: "completed",
      feedback: feedbackData || undefined,
    });

    return updated;
  }

  async getInterviewsForApplication(applicationId: string): Promise<Interview[]> {
    return this.storage.getInterviews(applicationId);
  }

  async sendInterviewReminders(): Promise<void> {
    const allInterviews = await this.storage.getInterviews();
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const interview of allInterviews) {
      if (
        interview.status === "scheduled" &&
        new Date(interview.scheduledAt) <= reminderThreshold &&
        new Date(interview.scheduledAt) > now
      ) {
        const applications = await this.storage.getApplications();
        const app = applications.find(a => a.id === interview.applicationId);

        if (app) {
          await this.notificationService.sendInterviewReminder({
            userId: app.jobSeekerId,
            interview,
          });
        }
      }
    }
  }

  async syncWithCalendar(
    tenantId: string,
    interview: Interview,
    application: Application,
    jobSeeker: User,
    interviewer: User
  ): Promise<string | undefined> {
    const googleCalendarConfig = await this.getCalendarIntegration(tenantId, "google_calendar");
    
    if (!googleCalendarConfig) {
      return undefined;
    }

    const jobSeekerName = `${jobSeeker.firstName || ""} ${jobSeeker.lastName || ""}`.trim() || "Candidate";
    const attendees = [jobSeeker.email, interviewer.email].filter((email): email is string => email !== null);
    
    const event: CalendarEvent = {
      title: `Interview: ${jobSeekerName}`,
      description: `Interview for application\nType: ${interview.interviewType}\n${interview.notes || ""}`,
      startTime: new Date(interview.scheduledAt),
      endTime: new Date(new Date(interview.scheduledAt).getTime() + interview.duration * 60000),
      attendees,
      location: interview.location || undefined,
      meetingUrl: interview.meetingUrl || undefined,
    };

    return "calendar-event-id-placeholder";
  }

  private async getCalendarIntegration(
    tenantId: string,
    integrationType: string
  ): Promise<IntegrationConfig | undefined> {
    const configs = await this.storage.getIntegrationConfigs(tenantId, integrationType);
    return configs.find(c => c.isEnabled);
  }
}
