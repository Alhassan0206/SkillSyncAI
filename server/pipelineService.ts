import type { Application, User } from "@shared/schema";
import type { IStorage } from "./storage";
import { NotificationService } from "./notificationService";

export type ApplicationStage = "applied" | "interview" | "offer" | "hired" | "rejected";

export interface StageTransition {
  from: ApplicationStage;
  to: ApplicationStage;
  timestamp: Date;
  changedBy: string;
  notes?: string;
}

export class PipelineService {
  private notificationService: NotificationService;

  constructor(private storage: IStorage) {
    this.notificationService = new NotificationService(storage);
  }

  async updateApplicationStage(
    application: Application,
    newStage: ApplicationStage,
    changedBy: User,
    notes?: string
  ): Promise<Application> {
    const job = await this.storage.getJobById(application.jobId);
    if (!job) {
      throw new Error("Job not found for this application");
    }

    const employerApplications = await this.storage.getApplicationsByEmployer(job.employerId);
    const validatedApp = employerApplications.find(a => a.id === application.id);
    
    if (!validatedApp) {
      throw new Error("Application not found or access denied");
    }

    const oldStage = validatedApp.status as ApplicationStage;

    if (!this.isValidTransition(oldStage, newStage)) {
      throw new Error(`Invalid stage transition from ${oldStage} to ${newStage}`);
    }

    const currentTimeline = (validatedApp.timeline as any[]) || [];
    const newTimelineEntry = {
      from: oldStage,
      to: newStage,
      stage: newStage,
      status: newStage,
      date: new Date().toISOString(),
      note: notes,
      changedBy: `${changedBy.firstName || ''} ${changedBy.lastName || ''}`.trim() || changedBy.email || 'System',
    };

    const updated = await this.storage.updateApplication(validatedApp.id, {
      status: newStage,
      timeline: [...currentTimeline, newTimelineEntry] as any,
    });

    await this.notificationService.sendApplicationStatusChange(
      {
        userId: validatedApp.jobSeekerId,
        application: updated,
        changedBy,
      },
      oldStage,
      newStage
    );

    return updated;
  }

  private isValidTransition(from: ApplicationStage, to: ApplicationStage): boolean {
    const validTransitions: Record<ApplicationStage, ApplicationStage[]> = {
      applied: ["interview", "rejected"],
      interview: ["offer", "rejected"],
      offer: ["hired", "rejected"],
      hired: [],
      rejected: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  async getApplicationsByStage(
    employerId: string,
    stage?: ApplicationStage
  ): Promise<Application[]> {
    const applications = await this.storage.getApplicationsByEmployer(employerId);
    
    if (stage) {
      return applications.filter(app => app.status === stage);
    }

    return applications;
  }

  async getApplicationTimeline(application: Application): Promise<StageTransition[]> {
    const timeline = (application.timeline as any[]) || [];
    
    return timeline.map(entry => ({
      from: (entry.from || entry.previousStage) as ApplicationStage,
      to: (entry.to || entry.stage) as ApplicationStage,
      timestamp: new Date(entry.date),
      changedBy: entry.changedBy || 'System',
      notes: entry.note,
    }));
  }

  async bulkUpdateStage(
    applications: Application[],
    newStage: ApplicationStage,
    changedBy: User,
    notes?: string
  ): Promise<Application[]> {
    const updated: Application[] = [];

    for (const app of applications) {
      try {
        const updatedApp = await this.updateApplicationStage(app, newStage, changedBy, notes);
        updated.push(updatedApp);
      } catch (error) {
        console.error(`Failed to update application ${app.id}:`, error);
      }
    }

    return updated;
  }

  async getStageMetrics(employerId: string): Promise<Record<ApplicationStage, number>> {
    const applications = await this.storage.getApplicationsByEmployer(employerId);

    const metrics: Record<ApplicationStage, number> = {
      applied: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
    };

    applications.forEach(app => {
      const stage = app.status as ApplicationStage;
      if (stage in metrics) {
        metrics[stage]++;
      }
    });

    return metrics;
  }
}
