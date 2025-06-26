import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { BadRequestError } from '../../../utils/errors';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, walletAddress } = req.body;
      const result = await this.authService.register({ email, password, name, walletAddress });
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, signature } = req.body;
      const result = await this.authService.walletLogin(walletAddress, signature);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }
      const user = await this.authService.getUserById(String(userId));
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
