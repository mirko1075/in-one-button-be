/**
 * Mock Helpers
 * Mock implementations for external services
 */

import { generateToken } from '../../utils/jwt';

/**
 * Generate test JWT token
 */
export const generateTestToken = (userId: string, email: string): string => {
  return generateToken({ userId, email });
};

/**
 * Mock Auth0 JWKS response
 */
export const mockAuth0Jwks = () => {
  return jest.fn().mockResolvedValue({
    keys: [
      {
        kid: 'test-key-id',
        kty: 'RSA',
        use: 'sig',
        n: 'test-modulus',
        e: 'AQAB',
      },
    ],
  });
};

/**
 * Mock Stripe customer
 */
export const mockStripeCustomer = {
  id: 'cus_test123',
  email: 'test@example.com',
  metadata: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
  },
};

/**
 * Mock Stripe checkout session
 */
export const mockStripeSession = {
  id: 'cs_test123',
  url: 'https://checkout.stripe.com/test',
  customer: 'cus_test123',
  payment_status: 'unpaid',
  status: 'open',
};

/**
 * Mock Stripe subscription
 */
export const mockStripeSubscription = {
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  items: {
    data: [
      {
        price: {
          id: 'price_test123',
        },
      },
    ],
  },
};

/**
 * Mock Deepgram response
 */
export const mockDeepgramResponse = {
  results: {
    channels: [
      {
        alternatives: [
          {
            transcript: 'This is a test transcript',
            confidence: 0.95,
            words: [
              { word: 'This', start: 0, end: 0.5, confidence: 0.95 },
              { word: 'is', start: 0.5, end: 0.8, confidence: 0.96 },
              { word: 'a', start: 0.8, end: 1.0, confidence: 0.94 },
              { word: 'test', start: 1.0, end: 1.5, confidence: 0.97 },
              { word: 'transcript', start: 1.5, end: 2.5, confidence: 0.93 },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Mock SendGrid response
 */
export const mockSendGridResponse = [
  {
    statusCode: 202,
    headers: {},
    body: '',
  },
];

/**
 * Mock Slack response
 */
export const mockSlackResponse = {
  ok: true,
  channel: 'C1234567890',
  ts: '1234567890.123456',
  message: {
    text: 'Test message',
  },
};
