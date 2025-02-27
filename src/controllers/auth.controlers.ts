// auth.controller.ts - Authentication Controller

// Import necessary types and services
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * Authentication Controller
 * Handles login requests and user authentication
 */
export class AuthController {
  /**
   * Login Handler
   * Processes user login attempts using wallet addresses
   * Returns a JWT token if authentication is successful
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract wallet address from request body
      const { walletAddress } = req.body;

      // Check if wallet address was provided
      if (!walletAddress) {
        return res.status(400).json({ success: false, message: 'Wallet address is required' });
      }

      // Authenticate user and get JWT token
      const token = await AuthService.authenticateUser(walletAddress);
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid wallet address or authentication failed' });
      }
      // Send token back to client
      res.status(200).json({ token });
    } catch (error) {
      // Pass any errors to error handling middleware
      next(error);
    }
  }
}
