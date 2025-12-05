/**
 * Billing Controller
 * Handles Stripe billing HTTP requests
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { StripeService } from '../services/stripe.service';
import { asyncHandler } from '../utils/asyncHandler';

export class BillingController {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  /**
   * Create checkout session
   * POST /api/billing/checkout
   */
  createCheckoutSession = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const userId = req.user!.userId;
      const { priceId, successUrl, cancelUrl } = req.body;

      const session = await this.stripeService.createCheckoutSession(userId, {
        priceId,
        successUrl,
        cancelUrl,
      });

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    },
  );

  /**
   * Create customer portal session
   * POST /api/billing/portal
   */
  createPortalSession = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const userId = req.user!.userId;
      const { returnUrl } = req.body;

      const session = await this.stripeService.createPortalSession(
        userId,
        returnUrl,
      );

      res.status(200).json({
        success: true,
        data: {
          url: session.url,
        },
      });
    },
  );

  /**
   * Handle Stripe webhook
   * POST /api/billing/webhook
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    await this.stripeService.handleWebhook(payload, signature);

    res.status(200).json({ received: true });
  });

  /**
   * Cancel subscription
   * POST /api/billing/cancel
   */
  cancelSubscription = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const userId = req.user!.userId;

      await this.stripeService.cancelSubscription(userId);

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    },
  );
}
