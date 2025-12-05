/**
 * User Controller
 * Handles user profile and settings HTTP requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { UserRepository } from '../repositories/user.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { asyncHandler } from '../utils/asyncHandler';

export class UserController {
  private userRepository: UserRepository;
  private settingsRepository: SettingsRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.settingsRepository = new SettingsRepository();
  }

  /**
   * Get user profile
   * GET /api/users/profile
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const user = await this.userRepository.findById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  /**
   * Update user profile
   * PATCH /api/users/profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { firstName, lastName, avatarUrl } = req.body;

    const user = await this.userRepository.update(userId, {
      firstName,
      lastName,
      avatarUrl,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  /**
   * Get user settings
   * GET /api/users/settings
   */
  getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const settings = await this.settingsRepository.findByUserId(userId);

    res.status(200).json({
      success: true,
      data: settings,
    });
  });

  /**
   * Update user settings
   * PATCH /api/users/settings
   */
  updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const updateData = req.body;

    const settings = await this.settingsRepository.update(userId, updateData);

    res.status(200).json({
      success: true,
      data: settings,
    });
  });

  /**
   * Delete user account
   * DELETE /api/users/account
   */
  deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    await this.userRepository.softDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  });
}
