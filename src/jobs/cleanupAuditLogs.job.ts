/**
 * Cleanup Audit Logs Cron Job
 * Deletes old audit logs to prevent database bloat
 */

import cron from 'node-cron';
import { AuditRepository } from '../repositories/audit.repository';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class CleanupAuditLogsJob {
  private auditRepository: AuditRepository;
  private job?: cron.ScheduledTask;
  private readonly RETENTION_DAYS = 365; // Keep audit logs for 1 year

  constructor() {
    this.auditRepository = new AuditRepository();
  }

  /**
   * Start the cron job
   * Runs weekly on Sunday at 3 AM
   */
  start(): void {
    if (!env.cron.enabled) {
      logger.info('Cron jobs are disabled');
      return;
    }

    this.job = cron.schedule('0 3 * * 0', async () => {
      await this.execute();
    });

    logger.info('Cleanup audit logs job started');
  }

  /**
   * Execute the cleanup
   */
  async execute(): Promise<void> {
    try {
      logger.info('Starting audit logs cleanup job');

      const deletedCount = await this.auditRepository.deleteOldLogs(
        this.RETENTION_DAYS,
      );

      logger.info(`Cleanup completed: deleted ${deletedCount} audit logs`);
    } catch (error) {
      logger.error('Audit logs cleanup job failed', { error });
    }
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      logger.info('Cleanup audit logs job stopped');
    }
  }
}
