/**
 * Cron Jobs Index
 * Initializes and manages all cron jobs
 */

import { CleanupMeetingsJob } from './cleanupMeetings.job';
import { CleanupAuditLogsJob } from './cleanupAuditLogs.job';
import { logger } from '../utils/logger';

export class JobManager {
  private cleanupMeetingsJob: CleanupMeetingsJob;
  private cleanupAuditLogsJob: CleanupAuditLogsJob;

  constructor() {
    this.cleanupMeetingsJob = new CleanupMeetingsJob();
    this.cleanupAuditLogsJob = new CleanupAuditLogsJob();
  }

  /**
   * Start all cron jobs
   */
  startAll(): void {
    logger.info('Starting all cron jobs');
    this.cleanupMeetingsJob.start();
    this.cleanupAuditLogsJob.start();
    logger.info('All cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  stopAll(): void {
    logger.info('Stopping all cron jobs');
    this.cleanupMeetingsJob.stop();
    this.cleanupAuditLogsJob.stop();
    logger.info('All cron jobs stopped successfully');
  }
}
