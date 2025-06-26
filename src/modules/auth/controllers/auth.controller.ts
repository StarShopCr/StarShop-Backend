import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { BadRequestError } from '../../../utils/errors';
import { StellarWalletLoginDto, RegisterUserDto, ChallengeDto } from '../dto/auth.dto';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Generate authentication challenge
   * POST /auth/challenge
   */
  async generateChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body as ChallengeDto;

      const challenge = this.authService.generateChallenge(walletAddress);

      res
        .status(200)
        .json({ success: true, data: { challenge, walletAddress, timestamp: Date.now() } });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  /**
   * Login with Stellar wallet
   * POST /auth/login
   */
  async loginWithWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, signature, message } = req.body as StellarWalletLoginDto;

      const result = await this.authService.loginWithWallet(walletAddress, signature, message);

      // Set JWT token in HttpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.expiresIn * 1000, // Convert to milliseconds
      });

      res
        .status(200)
        .json({
          success: true,
          data: {
            user: {
              id: result.user.id,
              walletAddress: result.user.walletAddress,
              name: result.user.name,
              email: result.user.email,
              role: result.user.userRoles?.[0]?.role?.name || 'buyer',
            },
            expiresIn: result.expiresIn,
          },
        });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  /**
   * Register new user with Stellar wallet
   * POST /auth/register
   */
  async registerWithWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, signature, message, name, email } = req.body as RegisterUserDto;

      const result = await this.authService.registerWithWallet({
        walletAddress,
        signature,
        message,
        name,
        email,
      });

      // Set JWT token in HttpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.expiresIn * 1000, // Convert to milliseconds
      });

      res
        .status(201)
        .json({
          success: true,
          data: {
            user: {
              id: result.user.id,
              walletAddress: result.user.walletAddress,
              name: result.user.name,
              email: result.user.email,
              role: result.user.userRoles?.[0]?.role?.name || 'buyer',
            },
            expiresIn: result.expiresIn,
          },
        });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get current authenticated user
   * GET /auth/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const user = await this.authService.getUserById(String(userId));

      res
        .status(200)
        .json({
          success: true,
          data: {
            id: user.id,
            walletAddress: user.walletAddress,
            name: user.name,
            email: user.email,
            role: user.userRoles?.[0]?.role?.name || 'buyer',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  /**
   * Logout user
   * DELETE /auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear the JWT cookie
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }
}
