/**
 * Authentication Validators
 * Zod schemas for authentication requests
 */

import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number',
      ),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const auth0CallbackSchema = z.object({
  body: z.object({
    auth0Id: z.string().min(1, 'Auth0 ID is required'),
    email: z.string().email('Invalid email format'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
});
