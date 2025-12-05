/**
 * Meeting Service
 * Business logic for meeting management
 */

import { MeetingRepository } from '../repositories/meeting.repository';
import { AuditRepository } from '../repositories/audit.repository';
import {
  CreateMeetingDTO,
  UpdateMeetingDTO,
  MeetingResponse,
  NotFoundError,
  ForbiddenError,
  PaginatedResponse,
} from '../types';
import { MeetingStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class MeetingService {
  private meetingRepository: MeetingRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.meetingRepository = new MeetingRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create new meeting
   */
  async createMeeting(
    userId: string,
    data: CreateMeetingDTO,
  ): Promise<MeetingResponse> {
    const meeting = await this.meetingRepository.create(userId, data);

    await this.auditRepository.create({
      userId,
      action: 'CREATE_MEETING',
      resource: 'meeting',
      resourceId: meeting.id,
      success: true,
    });

    return this.mapMeetingToResponse(meeting);
  }

  /**
   * Get meeting by ID
   */
  async getMeetingById(
    meetingId: string,
    userId: string,
  ): Promise<MeetingResponse> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundError('Meeting not found');
    }

    // Check ownership
    if (meeting.userId !== userId && meeting.privacy === 'private') {
      throw new ForbiddenError('Access denied to this meeting');
    }

    return this.mapMeetingToResponse(meeting);
  }

  /**
   * Get meeting by share token (public access)
   */
  async getMeetingByShareToken(shareToken: string): Promise<MeetingResponse> {
    const meeting = await this.meetingRepository.findByShareToken(shareToken);

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundError('Meeting not found');
    }

    return this.mapMeetingToResponse(meeting);
  }

  /**
   * Get user's meetings with pagination
   */
  async getUserMeetings(
    userId: string,
    page = 1,
    limit = 10,
    status?: MeetingStatus,
  ): Promise<PaginatedResponse<MeetingResponse>> {
    const { meetings, total } = await this.meetingRepository.findByUserId(
      userId,
      page,
      limit,
      status,
    );

    return {
      data: meetings.map((m) => this.mapMeetingToResponse(m)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update meeting
   */
  async updateMeeting(
    meetingId: string,
    userId: string,
    data: UpdateMeetingDTO,
  ): Promise<MeetingResponse> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundError('Meeting not found');
    }

    if (meeting.userId !== userId) {
      throw new ForbiddenError('Access denied to this meeting');
    }

    const updatedMeeting = await this.meetingRepository.update(meetingId, data);

    await this.auditRepository.create({
      userId,
      action: 'UPDATE_MEETING',
      resource: 'meeting',
      resourceId: meetingId,
      success: true,
    });

    return this.mapMeetingToResponse(updatedMeeting);
  }

  /**
   * Start meeting (update status to IN_PROGRESS)
   */
  async startMeeting(meetingId: string, userId: string): Promise<MeetingResponse> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundError('Meeting not found');
    }

    if (meeting.userId !== userId) {
      throw new ForbiddenError('Access denied to this meeting');
    }

    const updatedMeeting = await this.meetingRepository.updateStatus(
      meetingId,
      MeetingStatus.IN_PROGRESS,
    );

    await this.auditRepository.create({
      userId,
      action: 'START_MEETING',
      resource: 'meeting',
      resourceId: meetingId,
      success: true,
    });

    return this.mapMeetingToResponse(updatedMeeting);
  }

  /**
   * End meeting (update status to COMPLETED)
   */
  async endMeeting(meetingId: string, userId: string): Promise<MeetingResponse> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundError('Meeting not found');
    }

    if (meeting.userId !== userId) {
      throw new ForbiddenError('Access denied to this meeting');
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - new Date(meeting.startTime).getTime()) / 1000,
    );

    const updatedMeeting = await this.meetingRepository.update(meetingId, {
      status: MeetingStatus.COMPLETED,
      endTime,
    });

    await this.auditRepository.create({
      userId,
      action: 'END_MEETING',
      resource: 'meeting',
      resourceId: meetingId,
      success: true,
      metadata: { duration },
    });

    return this.mapMeetingToResponse(updatedMeeting);
  }

  /**
   * Generate share link for meeting
   */
  async generateShareLink(
    meetingId: string,
    userId: string,
  ): Promise<{ shareToken: string; shareUrl: string }> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundError('Meeting not found');
    }

    if (meeting.userId !== userId) {
      throw new ForbiddenError('Access denied to this meeting');
    }

    // Generate unique token
    const shareToken = uuidv4();
    await this.meetingRepository.generateShareToken(meetingId, shareToken);

    await this.auditRepository.create({
      userId,
      action: 'GENERATE_SHARE_LINK',
      resource: 'meeting',
      resourceId: meetingId,
      success: true,
    });

    return {
      shareToken,
      shareUrl: `${process.env.FRONTEND_URL}/share/${shareToken}`,
    };
  }

  /**
   * Delete meeting (soft delete)
   */
  async deleteMeeting(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundError('Meeting not found');
    }

    if (meeting.userId !== userId) {
      throw new ForbiddenError('Access denied to this meeting');
    }

    await this.meetingRepository.softDelete(meetingId);

    await this.auditRepository.create({
      userId,
      action: 'DELETE_MEETING',
      resource: 'meeting',
      resourceId: meetingId,
      success: true,
    });
  }

  /**
   * Get meeting statistics
   */
  async getMeetingStatistics(userId: string): Promise<any> {
    return this.meetingRepository.getStatistics(userId);
  }

  /**
   * Map Meeting entity to MeetingResponse DTO
   */
  private mapMeetingToResponse(meeting: any): MeetingResponse {
    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      duration: meeting.duration,
      status: meeting.status,
      transcript: meeting.transcript,
      summary: meeting.summary,
      actionItems: meeting.actionItems,
      audioUrl: meeting.audioUrl,
      privacy: meeting.privacy,
      participants: meeting.participants,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }
}
