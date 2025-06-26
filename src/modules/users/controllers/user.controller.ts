import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import { UpdateUserDto } from '../../auth/dto/auth.dto';

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  /**
   * Create new user (register)
   * POST /users
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, signature, message, name, email } = req.body;

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
        maxAge: result.expiresIn * 1000,
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
   * Update user information
   * PUT /users/update/:id
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const currentUserId = req.user?.id;
      const currentUserRole = req.user?.role?.[0];

      // Check if user is updating their own profile or is admin
      if (userId !== currentUserId && currentUserRole !== 'admin') {
        throw new UnauthorizedError('You can only update your own profile');
      }

      const updateData: { name?: string; email?: string } = req.body as UpdateUserDto;

      const updatedUser = await this.authService.updateUser(userId, updateData);

      res
        .status(200)
        .json({
          success: true,
          data: {
            id: updatedUser.id,
            walletAddress: updatedUser.walletAddress,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.userRoles?.[0]?.role?.name || 'buyer',
            updatedAt: updatedUser.updatedAt,
          },
        });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get user by ID (admin only or own profile)
   * GET /users/:id
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const currentUserId = req.user?.id;
      const currentUserRole = req.user?.role?.[0];

      // Check if user is accessing their own profile or is admin
      if (userId !== currentUserId && currentUserRole !== 'admin') {
        throw new UnauthorizedError('Access denied');
      }

      const user = await this.userService.getUserById(String(userId));

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
   * Get all users (admin only)
   * GET /users
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUserRole = req.user?.role?.[0];

      if (currentUserRole !== 'admin') {
        throw new UnauthorizedError('Admin access required');
      }

      const users = await this.userService.getUsers();

      res
        .status(200)
        .json({
          success: true,
          data: users.map((user) => ({
            id: user.id,
            walletAddress: user.walletAddress,
            name: user.name,
            email: user.email,
            role: user.userRoles?.[0]?.role?.name || 'buyer',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
        });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const user = await this.userService.getUserById(userId.toString());
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { name, email } = req.body;
      const user = await this.userService.updateUser(userId.toString(), { name, email });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const orders = await this.userService.getUserOrders(userId.toString());
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const wishlist = await this.userService.getUserWishlist(userId.toString());
      res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }
}
