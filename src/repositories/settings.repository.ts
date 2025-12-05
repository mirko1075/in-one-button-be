/**
 * Settings Repository
 * Data access layer for UserSettings model
 */

import { db } from '../config/database';
import { UserSettings } from '@prisma/client';
import { UpdateSettingsDTO } from '../types';

export class SettingsRepository {
  /**
   * Find settings by user ID
   */
  async findByUserId(userId: string): Promise<UserSettings | null> {
    return db.userSettings.findUnique({
      where: { userId },
    });
  }

  /**
   * Create default settings for user
   */
  async create(userId: string): Promise<UserSettings> {
    return db.userSettings.create({
      data: {
        userId,
      },
    });
  }

  /**
   * Update settings
   */
  async update(userId: string, data: UpdateSettingsDTO): Promise<UserSettings> {
    return db.userSettings.update({
      where: { userId },
      data,
    });
  }

  /**
   * Delete settings
   */
  async delete(userId: string): Promise<UserSettings> {
    return db.userSettings.delete({
      where: { userId },
    });
  }
}
