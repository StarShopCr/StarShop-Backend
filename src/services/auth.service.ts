// auth.service.ts - Authentication Service

// Import necessary packages and modules
import jwt from 'jsonwebtoken';
import AppDataSource from '../config/ormconfig';
import { User } from '../entities/User';

export interface TokenPayload {
  userId: string;
  walletAddress: string;
  role: string;
  iss: string; // Issuer
  aud: string; // Audience
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

export class AuthService {
  // Define constants for JWT configuration
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_EXPIRES_IN = '24h';
  private static readonly JWT_ISSUER = 'your-app-name';
  private static readonly JWT_AUDIENCE = 'your-app-clients';

  /**
   * Authenticates a user based on their wallet address
   * If the user doesn't exist, creates a new user
   * Returns a JWT token containing user information
   */
  static async authenticateUser(walletAddress: string): Promise<string> {
    // Validate JWT_SECRET existence
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Get access to the User table in the database
    const userRepository = AppDataSource.getRepository(User);

    // Try to find an existing user with this wallet address
    let user = await userRepository.findOne({ where: { walletAddress } });

    // If no user exists, create a new one
    if (!user) {
      user = userRepository.create({ walletAddress });
      await userRepository.save(user);
    }

    // Current timestamp in seconds
    const issuedAt = Math.floor(Date.now() / 1000);

    // Create a JWT token containing user information
    const token = jwt.sign(
      {
        userId: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
        iss: this.JWT_ISSUER,
        aud: this.JWT_AUDIENCE,
        iat: issuedAt,
      },
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN,
        algorithm: 'HS256',
      }
    );

    return token;
  }

  /**
   * Verifies if a JWT token is valid
   * Returns the decoded token information if valid
   * Throws an error if the token is invalid
   */
  static verifyToken(token: string): TokenPayload {
    // Validate JWT_SECRET existence
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    try {
      // Verify with explicit options
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE,
        algorithms: ['HS256'],
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Authentication failed');
      }
    }
  }
}
