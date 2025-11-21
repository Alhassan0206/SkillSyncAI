import { IStorage } from './storage';
import { AuditLogger } from './auditLog';

export class GDPRService {
  constructor(private storage: IStorage, private auditLogger: AuditLogger) {}

  async exportUserData(userId: string, req?: any): Promise<Record<string, any>> {
    try {
      const user = await this.storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const jobSeeker = await this.storage.getJobSeeker(userId);
      const employer = await this.storage.getEmployer(userId);
      const applications = jobSeeker ? await this.storage.getApplicationsByJobSeeker(jobSeeker.id) : [];
      const jobs = employer ? await this.storage.getJobsByEmployer(employer.id) : [];
      const notifications = await this.storage.getNotifications(userId, false);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        jobSeeker: jobSeeker ? {
          id: jobSeeker.id,
          currentRole: jobSeeker.currentRole,
          location: jobSeeker.location,
          remote: jobSeeker.remote,
          experience: jobSeeker.experience,
          skills: jobSeeker.skills,
          resumeUrl: jobSeeker.resumeUrl,
          portfolioUrl: jobSeeker.portfolioUrl,
          linkedinUrl: jobSeeker.linkedinUrl,
          githubUrl: jobSeeker.githubUrl,
          createdAt: jobSeeker.createdAt,
          updatedAt: jobSeeker.updatedAt,
        } : null,
        employer: employer ? {
          id: employer.id,
          companyName: employer.companyName,
          industry: employer.industry,
          companySize: employer.companySize,
          website: employer.website,
          createdAt: employer.createdAt,
          updatedAt: employer.updatedAt,
        } : null,
        applications: applications.map(app => ({
          id: app.id,
          jobId: app.jobId,
          status: app.status,
          stage: app.stage,
          coverLetter: app.coverLetter,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        })),
        jobs: jobs.map(job => ({
          id: job.id,
          title: job.title,
          description: job.description,
          location: job.location,
          remote: job.remote,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        })),
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt,
        })),
        exportDate: new Date().toISOString(),
      };

      // Log GDPR export action
      await this.auditLogger.logSensitiveAction(
        userId,
        'export',
        'user_data',
        userId,
        { dataSize: JSON.stringify(exportData).length },
        req
      );

      return exportData;
    } catch (error) {
      await this.auditLogger.logUserActionFailure(
        userId,
        'export_failed',
        'user_data',
        userId,
        error as Error,
        req
      );
      throw error;
    }
  }

  async deleteUserData(userId: string, req?: any): Promise<void> {
    try {
      const user = await this.storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Delete user-related data
      const jobSeeker = await this.storage.getJobSeeker(userId);
      const employer = await this.storage.getEmployer(userId);

      if (jobSeeker) {
        await this.storage.deleteJobSeeker(jobSeeker.id);
      }
      if (employer) {
        await this.storage.deleteEmployer(employer.id);
      }

      // Delete user profile
      await this.storage.deleteUser(userId);

      // Log GDPR deletion action
      await this.auditLogger.logSensitiveAction(
        userId,
        'delete',
        'user_data',
        userId,
        { deleted: ['user', 'jobSeeker', 'employer', 'applications', 'jobs'] },
        req
      );
    } catch (error) {
      await this.auditLogger.logUserActionFailure(
        userId,
        'delete_failed',
        'user_data',
        userId,
        error as Error,
        req
      );
      throw error;
    }
  }

  async getRightToBeForgotten(userId: string): Promise<{ status: string; message: string }> {
    try {
      const user = await this.storage.getUser(userId);
      if (!user) {
        return { status: 'not_found', message: 'User not found' };
      }

      return {
        status: 'eligible',
        message: 'User is eligible for data deletion under GDPR right to be forgotten',
      };
    } catch (error) {
      return {
        status: 'error',
        message: (error as Error).message,
      };
    }
  }
}

export function createGDPRService(storage: IStorage, auditLogger: AuditLogger): GDPRService {
  return new GDPRService(storage, auditLogger);
}
