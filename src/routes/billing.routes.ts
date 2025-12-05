/**
 * Billing Routes
 */

import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCheckoutSchema,
  createPortalSchema,
} from '../validators/billing.validator';

const router = Router();
const billingController = new BillingController();

// Protected routes
router.post(
  '/checkout',
  authenticate,
  validate(createCheckoutSchema),
  billingController.createCheckoutSession,
);

router.post(
  '/portal',
  authenticate,
  validate(createPortalSchema),
  billingController.createPortalSession,
);

router.post('/cancel', authenticate, billingController.cancelSubscription);

// Webhook route (no auth, validated by Stripe signature)
router.post('/webhook', billingController.handleWebhook);

export default router;
