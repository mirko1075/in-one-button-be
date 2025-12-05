/**
 * JWT Utility
 * JSON Web Token generation and verification
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

/**
 * Generate JWT token
 * @param payload Token payload
 * @returns Signed JWT token
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

/**
 * Verify JWT token
 * @param token JWT token
 * @returns Decoded payload
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
};

/**
 * Decode JWT token without verification
 * @param token JWT token
 * @returns Decoded payload
 */
export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};
