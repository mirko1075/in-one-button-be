/**
 * Meeting Repository
 * Data access layer for Meeting model
 */

import { db } from '../config/database';
import { Meeting, MeetingStatus, Prisma } from '@prisma/client';
import { CreateMeetingDTO, UpdateMeetingDTO } from '../types';

export class MeetingRepository {
  /**
   * Find meeting by ID
   */
  async findById(id: string): Promise<Meeting | null> {
    return db.meeting.findUnique({
      where: { id },
      include: {
        deliveries: true,
      },
    });
  }

  /**
   * Find meeting by share token
   */
  async findByShareToken(shareToken: string): Promise<Meeting | null> {
    return db.meeting.findUnique({
      where: { shareToken },
    });
  }

  /**
   * Find meetings by user ID
   */
  async findByUserId(
    userId: string,
    page = 1,
    limit = 10,
    status?: MeetingStatus,
  ): Promise<{ meetings: Meeting[]; total: number }> {
    const where: Prisma.MeetingWhereInput = {
      userId,
      deletedAt: null,
      ...(status && { status }),
    };

    const [meetings, total] = await Promise.all([
      db.meeting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          deliveries: true,
        },
      }),
      db.meeting.count({ where }),
    ]);

    return { meetings, total };
  }

  /**
   * Create new meeting
   */
  async create(userId: string, data: CreateMeetingDTO): Promise<Meeting> {
    return db.meeting.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        participants: data.participants as any,
        status: MeetingStatus.SCHEDULED,
      },
    });
  }

  /**
   * Update meeting
   */
  async update(id: string, data: UpdateMeetingDTO): Promise<Meeting> {
    const updateData: any = { ...data };

    // Convert actionItems to JSON if provided
    if (data.actionItems) {
      updateData.actionItems = data.actionItems as any;
    }

    return db.meeting.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Update meeting status
   */
  async updateStatus(id: string, status: MeetingStatus): Promise<Meeting> {
    return db.meeting.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Set meeting transcript
   */
  async setTranscript(
    id: string,
    transcript: string,
    transcriptionId?: string,
  ): Promise<Meeting> {
    return db.meeting.update({
      where: { id },
      data: {
        transcript,
        transcriptionId,
      },
    });
  }

  /**
   * Set audio URL
   */
  async setAudioUrl(
    id: string,
    audioUrl: string,
    audioSize?: number,
    audioDuration?: number,
  ): Promise<Meeting> {
    return db.meeting.update({
      where: { id },
      data: {
        audioUrl,
        audioSize,
        audioDuration,
      },
    });
  }

  /**
   * Generate share token
   */
  async generateShareToken(id: string, token: string): Promise<Meeting> {
    return db.meeting.update({
      where: { id },
      data: { shareToken: token },
    });
  }

  /**
   * Soft delete meeting
   */
  async softDelete(id: string): Promise<Meeting> {
    return db.meeting.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Hard delete meeting
   */
  async delete(id: string): Promise<Meeting> {
    return db.meeting.delete({
      where: { id },
    });
  }

  /**
   * Find old meetings for cleanup
   */
  async findOldMeetings(daysOld: number): Promise<Meeting[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return db.meeting.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        deletedAt: null,
      },
    });
  }

  /**
   * Get meeting statistics for user
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    totalDuration: number;
  }> {
    const [total, completed, inProgress, durations] = await Promise.all([
      db.meeting.count({
        where: { userId, deletedAt: null },
      }),
      db.meeting.count({
        where: { userId, status: MeetingStatus.COMPLETED, deletedAt: null },
      }),
      db.meeting.count({
        where: { userId, status: MeetingStatus.IN_PROGRESS, deletedAt: null },
      }),
      db.meeting.aggregate({
        where: { userId, deletedAt: null },
        _sum: { duration: true },
      }),
    ]);

    return {
      total,
      completed,
      inProgress,
      totalDuration: durations._sum.duration || 0,
    };
  }
}
