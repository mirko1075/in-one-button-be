/**
 * Billing Validators
 * Zod schemas for billing requests
 */

import { z } from 'zod';

export const createCheckoutSchema = z.object({
  body: z.object({
    priceId: z.string().startsWith('price_', 'Invalid price ID'),
    successUrl: z.string().url('Invalid success URL'),
    cancelUrl: z.string().url('Invalid cancel URL'),
  }),
});

export const createPortalSchema = z.object({
  body: z.object({
    returnUrl: z.string().url('Invalid return URL'),
  }),
});
