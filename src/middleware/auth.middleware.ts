/**
 * Authentication Middleware
 * Handles Auth0 JWT verification and local JWT fallback
 */

import { Response, NextFunction } from 'express';
import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, UnauthorizedError } from '../types';
import { logger } from '../utils/logger';

// JWKS client for Auth0
const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${env.auth0.domain}/.well-known/jwks.json`,
});

/**
 * Get signing key from Auth0
 */
const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

/**
 * Verify Auth0 JWT token
 */
const verifyAuth0Token = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: env.auth0.audience,
        issuer: env.auth0.issuer,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      },
    );
  });
};

/**
 * Verify local JWT token (fallback)
 */
const verifyLocalToken = (token: string): any => {
  return jwt.verify(token, env.jwt.secret);
};

/**
 * Authentication middleware
 * Supports both Auth0 and local JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      // Try Auth0 verification first
      const decoded = await verifyAuth0Token(token);
      req.user = {
        userId: decoded.sub,
        email: decoded.email || decoded['https://onebutton.com/email'],
        auth0Id: decoded.sub,
      };
    } catch (auth0Error) {
      // Fallback to local JWT
      try {
        const decoded = verifyLocalToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          auth0Id: decoded.auth0Id,
        };
      } catch (localError) {
        logger.error('Token verification failed', { auth0Error, localError });
        throw new UnauthorizedError('Invalid token');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Does not throw error if no token is provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = await verifyAuth0Token(token);
      req.user = {
        userId: decoded.sub,
        email: decoded.email || decoded['https://onebutton.com/email'],
        auth0Id: decoded.sub,
      };
    } catch {
      try {
        const decoded = verifyLocalToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          auth0Id: decoded.auth0Id,
        };
      } catch {
        // Ignore errors for optional auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
