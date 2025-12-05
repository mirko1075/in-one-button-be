/**
 * User Repository
 * Data access layer for User model
 */

import { db } from '../config/database';
import { User, Prisma } from '@prisma/client';
import { CreateUserDTO, UpdateUserDTO } from '../types';

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return db.user.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({
      where: { email },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Find user by Auth0 ID
   */
  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return db.user.findUnique({
      where: { auth0Id },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Find user by Stripe customer ID
   */
  async findByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    return db.user.findUnique({
      where: { stripeCustomerId },
    });
  }

  /**
   * Create new user
   */
  async create(data: CreateUserDTO): Promise<User> {
    return db.user.create({
      data: {
        email: data.email,
        password: data.password,
        auth0Id: data.auth0Id,
        firstName: data.firstName,
        lastName: data.lastName,
        settings: {
          create: {}, // Create default settings
        },
      },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserDTO): Promise<User> {
    return db.user.update({
      where: { id },
      data,
      include: {
        settings: true,
      },
    });
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    data: {
      subscriptionTier: string;
      subscriptionStatus: string;
      subscriptionId: string;
      stripeCustomerId?: string;
    },
  ): Promise<User> {
    return db.user.update({
      where: { id },
      data: {
        subscriptionTier: data.subscriptionTier as any,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionId: data.subscriptionId,
        ...(data.stripeCustomerId && { stripeCustomerId: data.stripeCustomerId }),
      },
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<User> {
    return db.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(id: string): Promise<User> {
    return db.user.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete user (deactivate)
   */
  async softDelete(id: string): Promise<User> {
    return db.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Hard delete user
   */
  async delete(id: string): Promise<User> {
    return db.user.delete({
      where: { id },
    });
  }

  /**
   * Get all users with pagination
   */
  async findAll(
    page = 1,
    limit = 10,
    filters?: Prisma.UserWhereInput,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await Promise.all([
      db.user.findMany({
        where: filters,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          settings: true,
        },
      }),
      db.user.count({ where: filters }),
    ]);

    return { users, total };
  }
}
