import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { CreateReviewDTO } from '../dto/review.dto';
import { BadRequestError } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        throw new BadRequestError('Invalid product ID');
      }

      const { rating, comment } = req.body as CreateReviewDTO;

      if (rating === undefined || rating === null) {
        throw new BadRequestError('Rating is required');
      }

      const review = await this.reviewService.createReview(userId, productId, rating, comment);

      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        throw new BadRequestError('Invalid product ID');
      }

      // Check for sorting parameters
      const sortBy = (req.query.sortBy as 'rating' | 'date') || 'date';
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

      let reviewsData;

      if (sortBy) {
        reviewsData = await this.reviewService.getSortedProductReviews(
          productId,
          sortBy,
          sortOrder
        );
      } else {
        reviewsData = await this.reviewService.getProductReviews(productId);
      }

      res.status(200).json({
        success: true,
        data: reviewsData,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const reviewId = req.params.reviewId;
      if (!reviewId) {
        throw new BadRequestError('Review ID is required');
      }

      const result = await this.reviewService.deleteReview(userId, reviewId);

      res.status(200).json({
        success: true,
        data: { deleted: result },
      });
    } catch (error) {
      next(error);
    }
  }
}
