import { Response } from 'express';
import { CartService } from '../services/cart.service';
import { BadRequestError } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../shared/types/auth-request.type';

export class CartController {
  constructor(private readonly cartService: CartService) {}

  async getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const cart = await this.cartService.getCart(String(userId));
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        throw new BadRequestError('Product ID and quantity are required');
      }

      const cart = await this.cartService.addItem(
        String(userId),
        String(productId),
        Number(quantity)
      );
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;
      const { quantity } = req.body;
      if (!quantity) {
        throw new BadRequestError('Quantity is required');
      }

      const cart = await this.cartService.updateItem(String(userId), id, Number(quantity));
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;
      const cart = await this.cartService.removeItem(String(userId), id);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async clearCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await this.cartService.clearCart(String(userId));
      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
