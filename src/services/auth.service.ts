/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

import { UserRepository } from '../repositories/user.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import {
  CreateUserDTO,
  UnauthorizedError,
  ConflictError,
  ValidationError,
  UserResponse,
} from '../types';
import { isValidEmail, isStrongPassword } from '../utils/validators';

export class AuthService {
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Register new user with email and password
   */
  async register(
    data: CreateUserDTO,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: UserResponse; token: string }> {
    // Validate email
    if (!isValidEmail(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password if provided (not needed for Auth0 users)
    if (data.password && !isStrongPassword(data.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters with uppercase, lowercase, and number',
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      await this.auditRepository.create({
        action: 'REGISTER_FAILED',
        success: false,
        errorMessage: 'Email already exists',
        ipAddress,
        userAgent,
      });
      throw new ConflictError('User with this email already exists');
    }

    // Hash password if provided
    const hashedPassword = data.password
      ? await hashPassword(data.password)
      : undefined;

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      auth0Id: user.auth0Id,
    });

    // Create audit log
    await this.auditRepository.create({
      userId: user.id,
      action: 'REGISTER',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      user: this.mapUserToResponse(user),
      token,
    };
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: UserResponse; token: string }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.password) {
      await this.auditRepository.create({
        action: 'LOGIN_FAILED',
        success: false,
        errorMessage: 'Invalid credentials',
        ipAddress,
        userAgent,
        metadata: { email },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      await this.auditRepository.create({
        userId: user.id,
        action: 'LOGIN_FAILED',
        success: false,
        errorMessage: 'Invalid password',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      await this.auditRepository.create({
        userId: user.id,
        action: 'LOGIN_FAILED',
        success: false,
        errorMessage: 'Account deactivated',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      auth0Id: user.auth0Id,
    });

    // Create audit log
    await this.auditRepository.create({
      userId: user.id,
      action: 'LOGIN',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      user: this.mapUserToResponse(user),
      token,
    };
  }

  /**
   * Authenticate Auth0 user (create if doesn't exist)
   */
  async authenticateAuth0User(
    auth0Id: string,
    email: string,
    profile?: { firstName?: string; lastName?: string; avatarUrl?: string },
  ): Promise<{ user: UserResponse; token: string }> {
    // Find or create user
    let user = await this.userRepository.findByAuth0Id(auth0Id);

    if (!user) {
      // Create new Auth0 user
      user = await this.userRepository.create({
        email,
        auth0Id,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
      });

      await this.auditRepository.create({
        userId: user.id,
        action: 'AUTH0_REGISTER',
        success: true,
      });
    } else {
      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      await this.auditRepository.create({
        userId: user.id,
        action: 'AUTH0_LOGIN',
        success: true,
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      auth0Id: user.auth0Id,
    });

    return {
      user: this.mapUserToResponse(user),
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findById(userId);
    return user ? this.mapUserToResponse(user) : null;
  }

  /**
   * Map User entity to UserResponse DTO
   */
  private mapUserToResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }
}
