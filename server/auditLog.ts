import { IStorage } from './storage';

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp?: Date;
}

export class AuditLogger {
  constructor(private storage: IStorage) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const auditEntry = {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: {
          changes: entry.changes,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          status: entry.status,
          errorMessage: entry.errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT LOG]', {
          timestamp: new Date().toISOString(),
          ...entry,
        });
      }

      // Log to storage (would need audit_logs table in real implementation)
      // await this.storage.createAuditLog(auditEntry);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async logUserAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entityType,
      entityId,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      status: 'success',
      timestamp: new Date(),
    });
  }

  async logUserActionFailure(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    error: Error,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entityType,
      entityId,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      status: 'failure',
      errorMessage: error.message,
      timestamp: new Date(),
    });
  }

  async logSensitiveAction(
    userId: string,
    action: string, // 'delete', 'export', 'modify_permissions', 'login', 'logout'
    entityType: string,
    entityId: string,
    changes?: Record<string, any>,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      status: 'success',
      timestamp: new Date(),
    });
  }
}

export function createAuditLogger(storage: IStorage): AuditLogger {
  return new AuditLogger(storage);
}
