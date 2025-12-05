/**
 * Test Data Helpers
 * Utility functions for generating test data
 */

import { CreateUserDTO, CreateMeetingDTO } from '../../types';
import { SubscriptionTier } from '@prisma/client';

export const createTestUser = (overrides?: Partial<CreateUserDTO>): CreateUserDTO => {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'Test1234',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
};

export const createTestMeeting = (
  overrides?: Partial<CreateMeetingDTO>,
): CreateMeetingDTO => {
  return {
    title: 'Test Meeting',
    description: 'Test meeting description',
    startTime: new Date(),
    participants: [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Doe', email: 'jane@example.com' },
    ],
    ...overrides,
  };
};

export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  password: 'hashed_password',
  auth0Id: null,
  firstName: 'Test',
  lastName: 'User',
  avatarUrl: null,
  stripeCustomerId: null,
  subscriptionTier: SubscriptionTier.FREE,
  subscriptionStatus: null,
  subscriptionId: null,
  isActive: true,
  isVerified: false,
  verifiedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
};

export const mockMeeting = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  userId: mockUser.id,
  title: 'Test Meeting',
  description: 'Test description',
  startTime: new Date(),
  endTime: null,
  duration: null,
  status: 'SCHEDULED' as const,
  transcriptionId: null,
  transcript: null,
  summary: null,
  actionItems: null,
  audioUrl: null,
  audioSize: null,
  audioDuration: null,
  privacy: 'private',
  shareToken: null,
  participants: [{ name: 'Test User' }],
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};
