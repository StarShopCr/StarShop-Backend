import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { BadRequestError, ForbiddenError } from '../../../utils/errors';
import { CreateUserDto, UpdateUserDto } from '../../../dtos/UserDTO';
import { Role } from '../../../types/role';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateUserDto = req.body;
      const user = await this.userService.createUser(dto);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateUserDto = req.body;
      const currentId = req.user?.id;
      const roles = req.user?.role || [];
      if (!currentId) {
        throw new BadRequestError('User not authenticated');
      }
      if (currentId.toString() !== id && !roles.includes(Role.ADMIN)) {
        throw new ForbiddenError('Not authorized');
      }
      const user = await this.userService.updateUser(id, dto);
      res.status(200).json({ success: true, data: user });
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
