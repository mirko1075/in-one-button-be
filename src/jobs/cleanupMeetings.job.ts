/**
 * Cleanup Meetings Cron Job
 * Deletes old meetings based on retention policy
 */

import cron from 'node-cron';
import { MeetingRepository } from '../repositories/meeting.repository';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class CleanupMeetingsJob {
  private meetingRepository: MeetingRepository;
  private job?: cron.ScheduledTask;

  constructor() {
    this.meetingRepository = new MeetingRepository();
  }

  /**
   * Start the cron job
   * Runs daily at 2 AM
   */
  start(): void {
    if (!env.cron.enabled) {
      logger.info('Cron jobs are disabled');
      return;
    }

    this.job = cron.schedule('0 2 * * *', async () => {
      await this.execute();
    });

    logger.info('Cleanup meetings job started');
  }

  /**
   * Execute the cleanup
   */
  async execute(): Promise<void> {
    try {
      logger.info('Starting meeting cleanup job');

      const retentionDays = env.cron.meetingRetentionDays;
      const oldMeetings = await this.meetingRepository.findOldMeetings(
        retentionDays,
      );

      logger.info(`Found ${oldMeetings.length} old meetings to delete`);

      let deletedCount = 0;
      for (const meeting of oldMeetings) {
        try {
          await this.meetingRepository.delete(meeting.id);
          deletedCount++;
        } catch (error) {
          logger.error('Failed to delete meeting', {
            meetingId: meeting.id,
            error,
          });
        }
      }

      logger.info(`Cleanup completed: deleted ${deletedCount} meetings`);
    } catch (error) {
      logger.error('Meeting cleanup job failed', { error });
    }
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      logger.info('Cleanup meetings job stopped');
    }
  }
}
