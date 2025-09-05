import { IsString, IsNumber, IsOptional, Min, Max, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSellerReviewDTO {
  @IsUUID()
  @IsNotEmpty()
  offerId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class SellerReviewResponseDTO {
  id: string;
  offerId: string;
  buyerId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  buyer?: {
    id: string;
    name?: string;
    walletAddress: string;
  };
  offer?: {
    id: string;
    title: string;
    price: number;
    sellerId: string;
  };
}

export class SellerReviewsResponseDTO {
  reviews: SellerReviewResponseDTO[];
  averageRating: number;
  totalReviews: number;
  seller: {
    id: string;
    name?: string;
    walletAddress: string;
    averageSellerRating: number;
    totalSellerReviews: number;
  };
}

export class UpdateSellerReviewDTO {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
