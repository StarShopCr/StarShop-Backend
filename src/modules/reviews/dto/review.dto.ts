import { IsString, IsNumber, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDTO {
  rating: number;
  comment?: string;
}

export class ReviewResponseDTO {
  id: string;
  userId: number;
  productId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  userName?: string; // Optional user information to include with reviews
}

export class ProductReviewsResponseDTO {
  reviews: ReviewResponseDTO[];
  averageRating: number;
  totalReviews: number;
}

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class UpdateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
