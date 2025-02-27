// auth.middleware.ts - Authentication Middleware

// Import necessary types and services
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * Interface for extending the Express Request type
 * Adds user information to the request object after authentication
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number; // User's unique identifier
    walletAddress: string; // User's blockchain wallet address
    role: string; // User's role (e.g., 'user', 'admin')
  };
}

/**
 * Authentication Middleware
 * Checks if the request has a valid JWT token
 * If valid, adds user information to the request object
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    // Check if authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ReferenceError('No token provided');
    }

    // Extract the token from the header
    // Format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify the token and decode its contents
    const decoded = AuthService.verifyToken(token);

    // Add user information to the request object
    req.user = {
      userId: decoded.userId,
      walletAddress: decoded.walletAddress,
      role: decoded.role,
    };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Pass any errors to error handling middleware
    next(error);
  }
};

/**
 * Role-based Access Control Middleware
 * Checks if the authenticated user has the required role
 * Must be used after authMiddleware
 */
export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if user exists and has the required role
    if (!req.user || req.user.role !== role) {
      throw new ReferenceError('Insufficient permissions');
    }
    // If role matches, continue to next middleware or route handler
    next();
  };
};
