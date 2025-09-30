import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import AppDataSource from '../../../config/ormconfig';
import { NotFoundError, BadRequestError } from '../../../utils/errors';
import { ProductReviewsResponseDTO, ReviewResponseDTO } from '../dto/review.dto';
import { ProductService } from '../../products/services/product.service';
import { UserService } from '../../users/services/user.service';

export class ReviewService {
  private repository: Repository<Review>;
  private productService: ProductService;
  private userService: UserService;

  constructor() {
    this.repository = AppDataSource.getRepository(Review);
    this.productService = new ProductService();
    this.userService = new UserService();
  }

  async createReview(
    userId: number,
    productId: number,
    rating: number,
    comment?: string
  ): Promise<Review> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    const product = await this.productService.getById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }

    try {
      await this.userService.getUserById(String(userId));
    } catch (error) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const existingReview = await this.repository.findOne({
      where: { userId, productId },
    });

    if (existingReview) {
      throw new BadRequestError('You have already reviewed this product');
    }

    const review = this.repository.create({
      userId,
      productId,
      rating,
      comment,
    });

    try {
      return await this.repository.save(review);
    } catch (error) {
      throw new BadRequestError(`Failed to create review: ${error.message}`);
    }
  }

  async getProductReviews(productId: number): Promise<ProductReviewsResponseDTO> {
    const product = await this.productService.getById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }

    const reviews = await this.repository.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    const reviewDTOs: ReviewResponseDTO[] = reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: review.user?.name || undefined,
    }));

    return {
      reviews: reviewDTOs,
      averageRating,
      totalReviews: reviews.length,
    };
  }

  async deleteReview(userId: number, reviewId: string): Promise<boolean> {
    const review = await this.repository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError(`Review with ID ${reviewId} not found`);
    }

    if (review.userId !== userId) {
      throw new BadRequestError('You can only delete your own reviews');
    }

    try {
      const result = await this.repository.delete(reviewId);
      return result.affected === 1;
    } catch (error) {
      throw new BadRequestError(`Failed to delete review: ${error.message}`);
    }
  }

  async getProductAverageRating(productId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .where('review.productId = :productId', { productId })
      .getRawOne();

    return result.averageRating ? parseFloat(result.averageRating) : 0;
  }

  async getSortedProductReviews(
    productId: number,
    sortBy: 'rating' | 'date' = 'date',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<ProductReviewsResponseDTO> {
    const product = await this.productService.getById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }

    const queryBuilder = this.repository
      .createQueryBuilder('review')
      .where('review.productId = :productId', { productId })
      .leftJoinAndSelect('review.user', 'user');

    if (sortBy === 'rating') {
      queryBuilder.orderBy('review.rating', sortOrder);
    } else {
      queryBuilder.orderBy('review.createdAt', sortOrder);
    }

    const reviews = await queryBuilder.getMany();
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    const reviewDTOs: ReviewResponseDTO[] = reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: review.user?.name || undefined,
    }));

    return {
      reviews: reviewDTOs,
      averageRating,
      totalReviews: reviews.length,
    };
  }
}
