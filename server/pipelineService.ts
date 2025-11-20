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
    applicationId: string,
    newStage: ApplicationStage,
    changedBy: User,
    notes?: string
  ): Promise<Application> {
    const applications = await this.storage.getAllApplications();
    const application = applications.find(a => a.id === applicationId);

    if (!application) {
      throw new Error("Application not found");
    }

    const oldStage = application.status as ApplicationStage;

    if (!this.isValidTransition(oldStage, newStage)) {
      throw new Error(`Invalid stage transition from ${oldStage} to ${newStage}`);
    }

    const updated = await this.storage.updateApplication(applicationId, {
      status: newStage,
    });

    await this.notificationService.sendApplicationStatusChange(
      {
        userId: application.jobSeekerId,
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
    const applications = await this.storage.getAllApplications();
    
    const filtered = applications.filter(app => {
      if (stage) {
        return app.status === stage;
      }
      return true;
    });

    return filtered;
  }

  async getApplicationTimeline(applicationId: string): Promise<StageTransition[]> {
    return [];
  }

  async bulkUpdateStage(
    applicationIds: string[],
    newStage: ApplicationStage,
    changedBy: User,
    notes?: string
  ): Promise<Application[]> {
    const updated: Application[] = [];

    for (const appId of applicationIds) {
      try {
        const app = await this.updateApplicationStage(appId, newStage, changedBy, notes);
        updated.push(app);
      } catch (error) {
        console.error(`Failed to update application ${appId}:`, error);
      }
    }

    return updated;
  }

  async getStageMetrics(employerId: string): Promise<Record<ApplicationStage, number>> {
    const applications = await this.storage.getAllApplications();

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
