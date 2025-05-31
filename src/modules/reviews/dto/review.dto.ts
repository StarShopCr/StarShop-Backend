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
