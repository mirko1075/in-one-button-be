/**
 * User Validators
 * Zod schemas for user requests
 */

import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    language: z.string().max(10).optional(),
    timezone: z.string().max(50).optional(),
    dateFormat: z.string().max(20).optional(),
    emailNotifications: z.boolean().optional(),
    slackNotifications: z.boolean().optional(),
    autoStartTranscription: z.boolean().optional(),
    defaultMeetingPrivacy: z.enum(['private', 'team', 'public']).optional(),
    audioQuality: z.enum(['low', 'medium', 'high']).optional(),
    autoSaveRecording: z.boolean().optional(),
    transcriptionModel: z.string().max(50).optional(),
    enablePunctuation: z.boolean().optional(),
    enableDiarization: z.boolean().optional(),
  }),
});
