import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { SellerReview } from './entities/seller-review.entity';
import { ReviewService } from './services/review.service';
import { SellerReviewService } from './services/seller-review.service';
import { ReviewController } from './controllers/review.controller';
import { SellerReviewController } from './controllers/seller-review.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, SellerReview]), SharedModule],
  controllers: [ReviewController, SellerReviewController],
  providers: [ReviewService, SellerReviewService],
  exports: [ReviewService, SellerReviewService],
})
export class ReviewsModule {}
