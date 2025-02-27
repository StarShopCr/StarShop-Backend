// auth.service.ts - Authentication Service

// Import necessary packages and modules
import jwt from 'jsonwebtoken'; // Used for creating and verifying JWT tokens
import AppDataSource from '../config/ormconfig'; // Database connection
import { User } from '../entities/User'; // User model/entity

export class AuthService {
  // Define constants for JWT configuration
  // JWT_SECRET is used to sign and verify tokens - loaded from environment variables
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  // JWT_EXPIRES_IN sets how long the token is valid
  private static readonly JWT_EXPIRES_IN = '24h';

  /**
   * Authenticates a user based on their wallet address
   * If the user doesn't exist, creates a new user
   * Returns a JWT token containing user information
   */
  static async authenticateUser(walletAddress: string): Promise<string> {
    // Get access to the User table in the database
    const userRepository = AppDataSource.getRepository(User);

    // Try to find an existing user with this wallet address
    let user = await userRepository.findOne({ where: { walletAddress } });

    // If no user exists, create a new one
    if (!user) {
      user = userRepository.create({ walletAddress });
      await userRepository.save(user);
    }

    // Create a JWT token containing user information
    const token = jwt.sign(
      {
        userId: user.id, // Include user ID in token
        walletAddress: user.walletAddress, // Include wallet address
        role: user.role, // Include user role
      },
      this.JWT_SECRET, // Sign with secret key
      { expiresIn: this.JWT_EXPIRES_IN } // Set token expiration
    );

    return token;
  }

  /**
   * Verifies if a JWT token is valid
   * Returns the decoded token information if valid
   * Throws an error if the token is invalid
   */
  static verifyToken(token: string): any {
    try {
      // Attempt to verify the token
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      // If verification fails, throw an error
      throw new ReferenceError('Invalid token');
    }
  }
}
