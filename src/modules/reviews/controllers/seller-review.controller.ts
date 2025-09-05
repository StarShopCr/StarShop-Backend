import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { SellerReviewService } from '../services/seller-review.service';
import { CreateSellerReviewDTO, UpdateSellerReviewDTO } from '../dto/seller-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../../wishlist/common/types/auth-request.type';

@Controller('reviews')
export class SellerReviewController {
  constructor(private readonly sellerReviewService: SellerReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(@Body() createReviewDto: CreateSellerReviewDTO, @Request() req: AuthRequest) {
    const buyerId = req.user.id;
    if (!buyerId) {
      throw new BadRequestException('User ID is required');
    }

    return this.sellerReviewService.createReview(buyerId, createReviewDto);
  }

  @Get('users/:id/reviews')
  async getSellerReviews(@Param('id') sellerId: string) {
    if (!sellerId) {
      throw new BadRequestException('Seller ID is required');
    }

    return this.sellerReviewService.getSellerReviews(sellerId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id') reviewId: string,
    @Body() updateData: UpdateSellerReviewDTO,
    @Request() req: AuthRequest
  ) {
    const buyerId = req.user.id;
    if (!buyerId) {
      throw new BadRequestException('User ID is required');
    }

    if (!reviewId) {
      throw new BadRequestException('Review ID is required');
    }

    return this.sellerReviewService.updateReview(reviewId, buyerId, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('id') reviewId: string, @Request() req: AuthRequest) {
    const buyerId = req.user.id;
    if (!buyerId) {
      throw new BadRequestException('User ID is required');
    }

    if (!reviewId) {
      throw new BadRequestException('Review ID is required');
    }

    return this.sellerReviewService.deleteReview(reviewId, buyerId);
  }
}
