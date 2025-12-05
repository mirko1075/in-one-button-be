/**
 * Audit Log Repository
 * Data access layer for AuditLog model
 */

import { db } from '../config/database';
import { AuditLog, Prisma } from '@prisma/client';
import { CreateAuditLogDTO } from '../types';

export class AuditRepository {
  /**
   * Create audit log entry
   */
  async create(data: CreateAuditLogDTO): Promise<AuditLog> {
    return db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success,
        errorMessage: data.errorMessage,
        metadata: data.metadata as any,
      },
    });
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = { userId };

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Find audit logs by action
   */
  async findByAction(
    action: string,
    page = 1,
    limit = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = { action };

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Find failed audit logs
   */
  async findFailedLogs(
    page = 1,
    limit = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = { success: false };

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Delete old audit logs
   */
  async deleteOldLogs(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
