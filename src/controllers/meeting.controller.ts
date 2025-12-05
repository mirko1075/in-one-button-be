/**
 * Meeting Controller
 * Handles meeting HTTP requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { MeetingService } from '../services/meeting.service';
import { asyncHandler } from '../utils/asyncHandler';
import { MeetingStatus } from '@prisma/client';

export class MeetingController {
  private meetingService: MeetingService;

  constructor() {
    this.meetingService = new MeetingService();
  }

  /**
   * Create new meeting
   * POST /api/meetings
   */
  createMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { title, description, startTime, participants } = req.body;

    const meeting = await this.meetingService.createMeeting(userId, {
      title,
      description,
      startTime: new Date(startTime),
      participants,
    });

    res.status(201).json({
      success: true,
      data: meeting,
    });
  });

  /**
   * Get meeting by ID
   * GET /api/meetings/:id
   */
  getMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const meeting = await this.meetingService.getMeetingById(id, userId);

    res.status(200).json({
      success: true,
      data: meeting,
    });
  });

  /**
   * Get user's meetings
   * GET /api/meetings
   */
  getMeetings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as MeetingStatus | undefined;

    const result = await this.meetingService.getUserMeetings(
      userId,
      page,
      limit,
      status,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  /**
   * Update meeting
   * PATCH /api/meetings/:id
   */
  updateMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updateData = req.body;

    const meeting = await this.meetingService.updateMeeting(
      id,
      userId,
      updateData,
    );

    res.status(200).json({
      success: true,
      data: meeting,
    });
  });

  /**
   * Start meeting
   * POST /api/meetings/:id/start
   */
  startMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const meeting = await this.meetingService.startMeeting(id, userId);

    res.status(200).json({
      success: true,
      data: meeting,
    });
  });

  /**
   * End meeting
   * POST /api/meetings/:id/end
   */
  endMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const meeting = await this.meetingService.endMeeting(id, userId);

    res.status(200).json({
      success: true,
      data: meeting,
    });
  });

  /**
   * Generate share link
   * POST /api/meetings/:id/share
   */
  generateShareLink = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = await this.meetingService.generateShareLink(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get meeting by share token (public)
   * GET /api/meetings/share/:token
   */
  getMeetingByShareToken = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { token } = req.params;

      const meeting = await this.meetingService.getMeetingByShareToken(token);

      res.status(200).json({
        success: true,
        data: meeting,
      });
    },
  );

  /**
   * Delete meeting
   * DELETE /api/meetings/:id
   */
  deleteMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await this.meetingService.deleteMeeting(id, userId);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  });

  /**
   * Get meeting statistics
   * GET /api/meetings/statistics
   */
  getStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const stats = await this.meetingService.getMeetingStatistics(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}
