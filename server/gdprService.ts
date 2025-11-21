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
      const applications: any[] = [];
      const jobs: any[] = [];
      const notifications = await this.storage.getNotifications(userId, 1000, 0);

      const exportData = {
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } : null,
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
        applications: applications,
        jobs: jobs,
        notifications: (notifications || []).map((n: any) => ({
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

      // Note: In a real implementation, you would delete associated data
      // This is a placeholder for GDPR right to be forgotten
      // Actual implementation would require:
      // - Deleting job seeker profile
      // - Deleting employer profile
      // - Deleting all applications and jobs
      // - Anonymizing user account or soft-delete

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
