import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include permission context
declare global {
  namespace Express {
    interface Request {
      permissionContext?: PermissionContext;
    }
  }
}

// ============================================
// Permission Service Types
// ============================================

export interface PermissionContext {
  userId: string;
  tenantId: string;
  permissions: schema.PermissionKey[];
  departmentId?: string;
  teamRoleId?: string;
  isOwner: boolean;
}

// ============================================
// Permission Service Class
// ============================================

export class PermissionService {
  
  // Get user's permission context
  async getPermissionContext(userId: string, tenantId: string): Promise<PermissionContext | null> {
    // Get user's team member role assignment
    const [memberRole] = await db.select()
      .from(schema.teamMemberRoles)
      .innerJoin(schema.teamRoles, eq(schema.teamMemberRoles.teamRoleId, schema.teamRoles.id))
      .where(and(
        eq(schema.teamMemberRoles.userId, userId),
        eq(schema.teamMemberRoles.tenantId, tenantId)
      ));

    if (!memberRole) {
      return null;
    }

    const teamRole = memberRole.team_roles;
    const memberRoleData = memberRole.team_member_roles;

    return {
      userId,
      tenantId,
      permissions: (teamRole.permissions || []) as schema.PermissionKey[],
      departmentId: memberRoleData.departmentId || undefined,
      teamRoleId: teamRole.id,
      isOwner: teamRole.systemRoleKey === 'owner',
    };
  }

  // Check if user has a specific permission
  async hasPermission(userId: string, tenantId: string, permission: schema.PermissionKey): Promise<boolean> {
    const context = await this.getPermissionContext(userId, tenantId);
    if (!context) return false;
    if (context.isOwner) return true; // Owner has all permissions
    return context.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId: string, tenantId: string, permissions: schema.PermissionKey[]): Promise<boolean> {
    const context = await this.getPermissionContext(userId, tenantId);
    if (!context) return false;
    if (context.isOwner) return true;
    return permissions.some(p => context.permissions.includes(p));
  }

  // Check if user has all of the specified permissions
  async hasAllPermissions(userId: string, tenantId: string, permissions: schema.PermissionKey[]): Promise<boolean> {
    const context = await this.getPermissionContext(userId, tenantId);
    if (!context) return false;
    if (context.isOwner) return true;
    return permissions.every(p => context.permissions.includes(p));
  }

  // ============================================
  // Team Role CRUD Operations
  // ============================================

  async getTeamRoles(tenantId: string): Promise<schema.TeamRole[]> {
    return db.select()
      .from(schema.teamRoles)
      .where(eq(schema.teamRoles.tenantId, tenantId))
      .orderBy(schema.teamRoles.isSystemRole, desc(schema.teamRoles.createdAt));
  }

  async getTeamRoleById(id: string): Promise<schema.TeamRole | undefined> {
    const [role] = await db.select()
      .from(schema.teamRoles)
      .where(eq(schema.teamRoles.id, id));
    return role;
  }

  async createTeamRole(data: schema.InsertTeamRole): Promise<schema.TeamRole> {
    const [role] = await db.insert(schema.teamRoles).values(data).returning();
    return role;
  }

  async updateTeamRole(id: string, data: Partial<schema.InsertTeamRole>): Promise<schema.TeamRole> {
    const [role] = await db.update(schema.teamRoles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.teamRoles.id, id))
      .returning();
    return role;
  }

  async deleteTeamRole(id: string): Promise<void> {
    await db.delete(schema.teamRoles).where(eq(schema.teamRoles.id, id));
  }

  // ============================================
  // Department CRUD Operations
  // ============================================

  async getDepartments(tenantId: string): Promise<schema.Department[]> {
    return db.select()
      .from(schema.departments)
      .where(eq(schema.departments.tenantId, tenantId))
      .orderBy(schema.departments.name);
  }

  async getDepartmentById(id: string): Promise<schema.Department | undefined> {
    const [dept] = await db.select()
      .from(schema.departments)
      .where(eq(schema.departments.id, id));
    return dept;
  }

  async createDepartment(data: schema.InsertDepartment): Promise<schema.Department> {
    const [dept] = await db.insert(schema.departments).values(data).returning();
    return dept;
  }

  async updateDepartment(id: string, data: Partial<schema.InsertDepartment>): Promise<schema.Department> {
    const [dept] = await db.update(schema.departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.departments.id, id))
      .returning();
    return dept;
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(schema.departments).where(eq(schema.departments.id, id));
  }

  // ============================================
  // Team Member Role Assignment Operations
  // ============================================

  async getTeamMemberRoles(tenantId: string): Promise<(schema.TeamMemberRole & { teamRole: schema.TeamRole; department: schema.Department | null })[]> {
    const results = await db.select()
      .from(schema.teamMemberRoles)
      .innerJoin(schema.teamRoles, eq(schema.teamMemberRoles.teamRoleId, schema.teamRoles.id))
      .leftJoin(schema.departments, eq(schema.teamMemberRoles.departmentId, schema.departments.id))
      .where(eq(schema.teamMemberRoles.tenantId, tenantId));

    return results.map(r => ({
      ...r.team_member_roles,
      teamRole: r.team_roles,
      department: r.departments,
    }));
  }

  async getTeamMemberRole(userId: string, tenantId: string): Promise<schema.TeamMemberRole | undefined> {
    const [memberRole] = await db.select()
      .from(schema.teamMemberRoles)
      .where(and(
        eq(schema.teamMemberRoles.userId, userId),
        eq(schema.teamMemberRoles.tenantId, tenantId)
      ));
    return memberRole;
  }

  async assignTeamRole(data: schema.InsertTeamMemberRole): Promise<schema.TeamMemberRole> {
    // First, remove any existing role assignment for this user in this tenant
    await db.delete(schema.teamMemberRoles).where(and(
      eq(schema.teamMemberRoles.userId, data.userId),
      eq(schema.teamMemberRoles.tenantId, data.tenantId)
    ));

    // Then create the new assignment
    const [memberRole] = await db.insert(schema.teamMemberRoles).values(data).returning();
    return memberRole;
  }

  async updateTeamMemberRole(id: string, data: Partial<schema.InsertTeamMemberRole>): Promise<schema.TeamMemberRole> {
    const [memberRole] = await db.update(schema.teamMemberRoles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.teamMemberRoles.id, id))
      .returning();
    return memberRole;
  }

  async removeTeamMemberRole(userId: string, tenantId: string): Promise<void> {
    await db.delete(schema.teamMemberRoles).where(and(
      eq(schema.teamMemberRoles.userId, userId),
      eq(schema.teamMemberRoles.tenantId, tenantId)
    ));
  }

  // ============================================
  // Permission Audit Logging
  // ============================================

  async logPermissionChange(data: schema.InsertPermissionAuditLog): Promise<schema.PermissionAuditLog> {
    const [log] = await db.insert(schema.permissionAuditLogs).values(data).returning();
    return log;
  }

  async getPermissionAuditLogs(
    tenantId: string,
    filters?: { actorId?: string; targetUserId?: string; action?: string; limit?: number; offset?: number }
  ): Promise<schema.PermissionAuditLog[]> {
    const conditions = [eq(schema.permissionAuditLogs.tenantId, tenantId)];

    if (filters?.actorId) {
      conditions.push(eq(schema.permissionAuditLogs.actorId, filters.actorId));
    }
    if (filters?.targetUserId) {
      conditions.push(eq(schema.permissionAuditLogs.targetUserId, filters.targetUserId));
    }
    if (filters?.action) {
      conditions.push(eq(schema.permissionAuditLogs.action, filters.action));
    }

    let query = db.select()
      .from(schema.permissionAuditLogs)
      .where(and(...conditions))
      .orderBy(desc(schema.permissionAuditLogs.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }

    return query;
  }

  // ============================================
  // Initialize System Roles for Tenant
  // ============================================

  async initializeSystemRoles(tenantId: string, createdBy?: string): Promise<schema.TeamRole[]> {
    const roles: schema.TeamRole[] = [];

    for (const [key, config] of Object.entries(schema.SYSTEM_ROLES)) {
      // Check if role already exists
      const existing = await db.select()
        .from(schema.teamRoles)
        .where(and(
          eq(schema.teamRoles.tenantId, tenantId),
          eq(schema.teamRoles.systemRoleKey, key)
        ));

      if (existing.length === 0) {
        const [role] = await db.insert(schema.teamRoles).values({
          tenantId,
          name: config.name,
          description: config.description,
          permissions: config.permissions,
          isSystemRole: true,
          systemRoleKey: key,
          createdBy,
        }).returning();
        roles.push(role);
      } else {
        roles.push(existing[0]);
      }
    }

    return roles;
  }

  // Get system role by key for a tenant
  async getSystemRole(tenantId: string, roleKey: schema.SystemRoleKey): Promise<schema.TeamRole | undefined> {
    const [role] = await db.select()
      .from(schema.teamRoles)
      .where(and(
        eq(schema.teamRoles.tenantId, tenantId),
        eq(schema.teamRoles.systemRoleKey, roleKey)
      ));
    return role;
  }
}

export const permissionService = new PermissionService();

// ============================================
// Permission Middleware
// ============================================

/**
 * Middleware to load permission context for the current user
 * Must be used after authentication middleware
 */
export function loadPermissionContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return next();
      }

      const context = await permissionService.getPermissionContext(user.id, user.tenantId);
      if (context) {
        req.permissionContext = context;
      }
      next();
    } catch (error) {
      console.error('Error loading permission context:', error);
      next();
    }
  };
}

/**
 * Middleware to require a specific permission
 */
export function requirePermission(permission: schema.PermissionKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user has the required permission
      const hasPermission = await permissionService.hasPermission(user.id, user.tenantId, permission);

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Permission denied',
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission verification failed' });
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(permissions: schema.PermissionKey[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const hasPermission = await permissionService.hasAnyPermission(user.id, user.tenantId, permissions);

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Permission denied',
          requiredPermissions: permissions,
          requireAll: false
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission verification failed' });
    }
  };
}

/**
 * Middleware to require all of the specified permissions
 */
export function requireAllPermissions(permissions: schema.PermissionKey[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const hasPermission = await permissionService.hasAllPermissions(user.id, user.tenantId, permissions);

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Permission denied',
          requiredPermissions: permissions,
          requireAll: true
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission verification failed' });
    }
  };
}

