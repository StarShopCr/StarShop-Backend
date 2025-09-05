import { Repository } from 'typeorm';
import { SellerReview } from '../entities/seller-review.entity';
import { User } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';
import AppDataSource from '../../../config/ormconfig';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../../utils/errors';
import { 
  SellerReviewResponseDTO, 
  SellerReviewsResponseDTO, 
  CreateSellerReviewDTO 
} from '../dto/seller-review.dto';

export class SellerReviewService {
  private reviewRepository: Repository<SellerReview>;
  private userRepository: Repository<User>;
  private offerRepository: Repository<Offer>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(SellerReview);
    this.userRepository = AppDataSource.getRepository(User);
    this.offerRepository = AppDataSource.getRepository(Offer);
  }

  async createReview(
    buyerId: string,
    createReviewDto: CreateSellerReviewDTO
  ): Promise<SellerReviewResponseDTO> {
    const { offerId, rating, comment } = createReviewDto;

    // Validate offer exists and get it with relations
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['seller', 'buyerRequest'],
    });

    if (!offer) {
      throw new NotFoundError(`Offer with ID ${offerId} not found`);
    }

    // Validate that the buyer is the one who made the purchase
    if (offer.buyerRequest.buyerId !== buyerId) {
      throw new ForbiddenError('Only the buyer who confirmed the purchase can review this offer');
    }

    // Validate that the offer was purchased
    if (!offer.wasPurchased) {
      throw new BadRequestError('Can only review offers that have been purchased');
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findOne({
      where: { offerId, buyerId },
    });

    if (existingReview) {
      throw new BadRequestError('You have already reviewed this offer');
    }

    // Validate buyer exists
    const buyer = await this.userRepository.findOne({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new NotFoundError(`Buyer with ID ${buyerId} not found`);
    }

    // Create the review
    const review = this.reviewRepository.create({
      offerId,
      buyerId,
      rating,
      comment,
    });

    try {
      const savedReview = await this.reviewRepository.save(review);
      
      // Update seller's average rating
      await this.updateSellerRating(offer.sellerId);

      return this.mapToResponseDTO(savedReview, buyer, offer);
    } catch (error) {
      throw new BadRequestError(`Failed to create review: ${error.message}`);
    }
  }

  async getSellerReviews(sellerId: string): Promise<SellerReviewsResponseDTO> {
    // Validate seller exists
    const seller = await this.userRepository.findOne({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new NotFoundError(`Seller with ID ${sellerId} not found`);
    }

    // Get all reviews for this seller
    const reviews = await this.reviewRepository.find({
      where: { offer: { sellerId } },
      relations: ['buyer', 'offer'],
      order: { createdAt: 'DESC' },
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Map to response DTOs
    const reviewDTOs: SellerReviewResponseDTO[] = reviews.map((review) => 
      this.mapToResponseDTO(review, review.buyer, review.offer)
    );

    return {
      reviews: reviewDTOs,
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      totalReviews: reviews.length,
      seller: {
        id: seller.id,
        name: seller.name,
        walletAddress: seller.walletAddress,
        averageSellerRating: seller.averageSellerRating || 0,
        totalSellerReviews: seller.totalSellerReviews || 0,
      },
    };
  }

  async updateReview(
    reviewId: string,
    buyerId: string,
    updateData: { rating?: number; comment?: string }
  ): Promise<SellerReviewResponseDTO> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['buyer', 'offer'],
    });

    if (!review) {
      throw new NotFoundError(`Review with ID ${reviewId} not found`);
    }

    if (review.buyerId !== buyerId) {
      throw new ForbiddenError('You can only update your own reviews');
    }

    // Update the review
    if (updateData.rating !== undefined) {
      review.rating = updateData.rating;
    }
    if (updateData.comment !== undefined) {
      review.comment = updateData.comment;
    }

    try {
      const updatedReview = await this.reviewRepository.save(review);
      
      // Update seller's average rating
      await this.updateSellerRating(review.offer.sellerId);

      return this.mapToResponseDTO(updatedReview, review.buyer, review.offer);
    } catch (error) {
      throw new BadRequestError(`Failed to update review: ${error.message}`);
    }
  }

  async deleteReview(reviewId: string, buyerId: string): Promise<boolean> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['offer'],
    });

    if (!review) {
      throw new NotFoundError(`Review with ID ${reviewId} not found`);
    }

    if (review.buyerId !== buyerId) {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    try {
      const result = await this.reviewRepository.delete(reviewId);
      
      if (result.affected === 1) {
        // Update seller's average rating
        await this.updateSellerRating(review.offer.sellerId);
        return true;
      }
      return false;
    } catch (error) {
      throw new BadRequestError(`Failed to delete review: ${error.message}`);
    }
  }

  async getSellerAverageRating(sellerId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.offer', 'offer')
      .select('AVG(review.rating)', 'averageRating')
      .where('offer.sellerId = :sellerId', { sellerId })
      .getRawOne();

    return result.averageRating ? parseFloat(result.averageRating) : 0;
  }

  private async updateSellerRating(sellerId: string): Promise<void> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.offer', 'offer')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('offer.sellerId = :sellerId', { sellerId })
      .getRawOne();

    const averageRating = result.averageRating ? parseFloat(result.averageRating) : 0;
    const totalReviews = parseInt(result.totalReviews) || 0;

    await this.userRepository.update(sellerId, {
      averageSellerRating: Math.round(averageRating * 100) / 100,
      totalSellerReviews: totalReviews,
    });
  }

  private mapToResponseDTO(
    review: SellerReview,
    buyer: User,
    offer: Offer
  ): SellerReviewResponseDTO {
    return {
      id: review.id,
      offerId: review.offerId,
      buyerId: review.buyerId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      buyer: {
        id: buyer.id,
        name: buyer.name,
        walletAddress: buyer.walletAddress,
      },
      offer: {
        id: offer.id,
        title: offer.title,
        price: offer.price,
        sellerId: offer.sellerId,
      },
    };
  }
}
