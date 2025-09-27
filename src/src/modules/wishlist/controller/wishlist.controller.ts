import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { WishlistService } from '../services/wishlist.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AuthRequest } from '../common/types/auth-request.type';
import { Wishlist } from '../entities/wishlist.entity';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  async addToWishlist(
    @Param('productId') productId: string,
    @Req() req: AuthRequest
  ): Promise<{ message: string }> {
    const userId = String(req.user.id);
    await this.wishlistService.addToWishlist(userId, productId);
    return { message: 'Product added to wishlist' };
  }

  @Delete(':productId')
  @HttpCode(204)
  async removeFromWishlist(
    @Param('productId') productId: string,
    @Req() req: AuthRequest
  ): Promise<void> {
    const userId = String(req.user.id);
    await this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Get()
  async getWishlist(@Req() req: AuthRequest): Promise<{ wishlist: Wishlist[] }> {
    const userId = String(req.user.id);
    const wishlist = await this.wishlistService.getWishlist(userId);
    return { wishlist };
  }
}