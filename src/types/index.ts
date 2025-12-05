/**
 * Type Definitions
 * Centralized type definitions for the application
 */

import { Request } from 'express';
import { SubscriptionTier, MeetingStatus } from '@prisma/client';

// =============================================================================
// Authentication Types
// =============================================================================

export interface JwtPayload {
  userId: string;
  email: string;
  auth0Id?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// =============================================================================
// User Types
// =============================================================================

export interface CreateUserDTO {
  email: string;
  password?: string;
  auth0Id?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

// =============================================================================
// Meeting Types
// =============================================================================

export interface CreateMeetingDTO {
  title: string;
  description?: string;
  startTime: Date;
  participants?: Participant[];
}

export interface UpdateMeetingDTO {
  title?: string;
  description?: string;
  endTime?: Date;
  status?: MeetingStatus;
  transcript?: string;
  summary?: string;
  actionItems?: ActionItem[];
}

export interface Participant {
  name: string;
  email?: string;
  role?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  completed: boolean;
}

export interface MeetingResponse {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: MeetingStatus;
  transcript?: string;
  summary?: string;
  actionItems?: ActionItem[];
  audioUrl?: string;
  privacy: string;
  participants?: Participant[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Transcription Types
// =============================================================================

export interface TranscriptionConfig {
  model?: string;
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
  smart_format?: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words?: TranscriptWord[];
  utterances?: Utterance[];
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export interface Utterance {
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: TranscriptWord[];
  speaker?: number;
}

// =============================================================================
// Delivery Types
// =============================================================================

export interface EmailDeliveryDTO {
  recipient: string;
  subject: string;
  content: string;
  meetingId: string;
}

export interface SlackDeliveryDTO {
  channel: string;
  message: string;
  meetingId: string;
}

// =============================================================================
// Billing Types
// =============================================================================

export interface CreateCheckoutSessionDTO {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface SubscriptionUpdateDTO {
  tier: SubscriptionTier;
  status: string;
  subscriptionId: string;
  stripeCustomerId: string;
}

// =============================================================================
// Settings Types
// =============================================================================

export interface UpdateSettingsDTO {
  language?: string;
  timezone?: string;
  dateFormat?: string;
  emailNotifications?: boolean;
  slackNotifications?: boolean;
  autoStartTranscription?: boolean;
  defaultMeetingPrivacy?: string;
  audioQuality?: string;
  autoSaveRecording?: boolean;
  transcriptionModel?: string;
  enablePunctuation?: boolean;
  enableDiarization?: boolean;
}

// =============================================================================
// Error Types
// =============================================================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

// =============================================================================
// Audit Log Types
// =============================================================================

export interface CreateAuditLogDTO {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

// =============================================================================
// WebSocket Types
// =============================================================================

export interface AudioStreamConfig {
  meetingId: string;
  userId: string;
  sampleRate?: number;
  encoding?: string;
  channels?: number;
}

export interface AudioChunk {
  data: Buffer;
  timestamp: number;
}

// =============================================================================
// Pagination Types
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
