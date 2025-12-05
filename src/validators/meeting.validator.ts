/**
 * Meeting Validators
 * Zod schemas for meeting requests
 */

import { z } from 'zod';

export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().max(1000).optional(),
    startTime: z.string().datetime('Invalid datetime format'),
    participants: z
      .array(
        z.object({
          name: z.string(),
          email: z.string().email().optional(),
          role: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

export const updateMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    endTime: z.string().datetime().optional(),
    status: z
      .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'])
      .optional(),
    transcript: z.string().optional(),
    summary: z.string().optional(),
    actionItems: z
      .array(
        z.object({
          id: z.string(),
          description: z.string(),
          assignee: z.string().optional(),
          dueDate: z.string().datetime().optional(),
          completed: z.boolean(),
        }),
      )
      .optional(),
  }),
});

export const meetingIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid meeting ID'),
  }),
});

export const shareTokenSchema = z.object({
  params: z.object({
    token: z.string().uuid('Invalid share token'),
  }),
});
