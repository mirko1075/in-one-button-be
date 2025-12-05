/**
 * Stripe Service
 * Handles Stripe billing, subscriptions, and webhooks
 */

import Stripe from 'stripe';
import { env } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { CreateCheckoutSessionDTO, NotFoundError } from '../types';
import { logger } from '../utils/logger';

export class StripeService {
  private stripe: Stripe;
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.stripe = new Stripe(env.stripe.secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(
    userId: string,
    data: CreateCheckoutSessionDTO,
  ): Promise<Stripe.Checkout.Session> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await this.userRepository.update(userId, {
        stripeCustomerId: customerId,
      } as any);
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    await this.auditRepository.create({
      userId,
      action: 'CREATE_CHECKOUT_SESSION',
      success: true,
      metadata: { sessionId: session.id, priceId: data.priceId },
    });

    return session;
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new NotFoundError('Customer not found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    await this.auditRepository.create({
      userId,
      action: 'CREATE_PORTAL_SESSION',
      success: true,
    });

    return session;
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(
    payload: string | Buffer,
    signature: string,
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.stripe.webhookSecret,
      );
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err });
      throw new Error('Webhook signature verification failed');
    }

    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      logger.error('No userId in checkout session metadata');
      return;
    }

    logger.info('Checkout session completed', { userId, sessionId: session.id });

    // Subscription will be updated via subscription.created/updated webhook
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.customer as string;
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      logger.error('User not found for subscription update', { customerId });
      return;
    }

    // Determine subscription tier from price ID
    const priceId = subscription.items.data[0]?.price.id;
    let tier = 'FREE';
    if (priceId === env.stripe.priceIds.pro) {
      tier = 'PRO';
    } else if (priceId === env.stripe.priceIds.enterprise) {
      tier = 'ENTERPRISE';
    }

    await this.userRepository.updateSubscription(user.id, {
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
    });

    await this.auditRepository.create({
      userId: user.id,
      action: 'SUBSCRIPTION_UPDATED',
      success: true,
      metadata: { tier, status: subscription.status },
    });

    logger.info('Subscription updated', {
      userId: user.id,
      tier,
      status: subscription.status,
    });
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.customer as string;
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      logger.error('User not found for subscription deletion', { customerId });
      return;
    }

    await this.userRepository.updateSubscription(user.id, {
      subscriptionTier: 'FREE',
      subscriptionStatus: 'canceled',
      subscriptionId: subscription.id,
    });

    await this.auditRepository.create({
      userId: user.id,
      action: 'SUBSCRIPTION_CANCELLED',
      success: true,
    });

    logger.info('Subscription cancelled', { userId: user.id });
  }

  /**
   * Handle invoice payment succeeded
   */
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const customerId = invoice.customer as string;
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      logger.error('User not found for invoice payment', { customerId });
      return;
    }

    await this.auditRepository.create({
      userId: user.id,
      action: 'INVOICE_PAYMENT_SUCCEEDED',
      success: true,
      metadata: { invoiceId: invoice.id, amount: invoice.amount_paid },
    });

    logger.info('Invoice payment succeeded', {
      userId: user.id,
      invoiceId: invoice.id,
    });
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const customerId = invoice.customer as string;
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      logger.error('User not found for invoice payment failure', { customerId });
      return;
    }

    await this.auditRepository.create({
      userId: user.id,
      action: 'INVOICE_PAYMENT_FAILED',
      success: false,
      metadata: { invoiceId: invoice.id },
    });

    logger.error('Invoice payment failed', {
      userId: user.id,
      invoiceId: invoice.id,
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.subscriptionId) {
      throw new NotFoundError('Subscription not found');
    }

    await this.stripe.subscriptions.cancel(user.subscriptionId);

    await this.auditRepository.create({
      userId,
      action: 'CANCEL_SUBSCRIPTION',
      success: true,
    });
  }
}
