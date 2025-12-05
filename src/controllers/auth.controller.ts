/**
 * Authentication Controller
 * Handles authentication HTTP requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    const result = await this.authService.register(
      { email, password, firstName, lastName },
      req.ip,
      req.get('user-agent'),
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * Login with email and password
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await this.authService.login(
      email,
      password,
      req.ip,
      req.get('user-agent'),
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get current user
   * GET /api/auth/me
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await this.authService.getUserById(req.user!.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  /**
   * Auth0 callback (create or login user)
   * POST /api/auth/auth0
   */
  auth0Callback = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { auth0Id, email, firstName, lastName, avatarUrl } = req.body;

    const result = await this.authService.authenticateAuth0User(
      auth0Id,
      email,
      { firstName, lastName, avatarUrl },
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
