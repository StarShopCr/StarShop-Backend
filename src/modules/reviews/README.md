# Seller Review System

This module implements a comprehensive review and rating system for sellers based on completed offers. Buyers can rate and review sellers after confirming a purchase, which helps build trust and assists future buyers in making informed decisions.

## Features

- ✅ **One review per offer**: Ensures each offer can only be reviewed once
- ✅ **Buyer validation**: Only the buyer who confirmed the purchase can review
- ✅ **Rating validation**: Ratings must be between 1-5 stars
- ✅ **Seller rating aggregation**: Automatic calculation of average ratings
- ✅ **Comprehensive API**: Full CRUD operations for reviews
- ✅ **Data validation**: Robust input validation and error handling
- ✅ **Test coverage**: Unit and integration tests included

## Database Schema

### SellerReviews Table
```sql
CREATE TABLE seller_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(offer_id, buyer_id)
);
```

### User Table Updates
```sql
ALTER TABLE users ADD COLUMN average_seller_rating DECIMAL(3,2);
ALTER TABLE users ADD COLUMN total_seller_reviews INT DEFAULT 0;
```

## API Endpoints

### POST /api/v1/reviews
Create a new review for a seller based on an offer.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "offerId": "uuid",
  "rating": 5,
  "comment": "Great seller! Very responsive and professional."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "offerId": "offer-uuid",
    "buyerId": "buyer-uuid",
    "rating": 5,
    "comment": "Great seller!",
    "createdAt": "2024-01-15T10:30:00Z",
    "buyer": {
      "id": "buyer-uuid",
      "name": "John Doe",
      "walletAddress": "buyer-wallet-address"
    },
    "offer": {
      "id": "offer-uuid",
      "title": "Custom Product",
      "price": 100.00,
      "sellerId": "seller-uuid"
    }
  }
}
```

### GET /api/v1/users/:id/reviews
Get all reviews for a specific seller.

**Authentication**: Not required (Public endpoint)

**Response**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "offerId": "offer-uuid",
        "buyerId": "buyer-uuid",
        "rating": 5,
        "comment": "Great seller!",
        "createdAt": "2024-01-15T10:30:00Z",
        "buyer": {
          "id": "buyer-uuid",
          "name": "John Doe",
          "walletAddress": "buyer-wallet-address"
        },
        "offer": {
          "id": "offer-uuid",
          "title": "Custom Product",
          "price": 100.00,
          "sellerId": "seller-uuid"
        }
      }
    ],
    "averageRating": 4.5,
    "totalReviews": 10,
    "seller": {
      "id": "seller-uuid",
      "name": "Jane Smith",
      "walletAddress": "seller-wallet-address",
      "averageSellerRating": 4.5,
      "totalSellerReviews": 10
    }
  }
}
```

### PUT /api/v1/reviews/:id
Update an existing review.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

### DELETE /api/v1/reviews/:id
Delete a review.

**Authentication**: Required (JWT)

## Business Rules

1. **One Review Per Offer**: Each offer can only be reviewed once by the buyer
2. **Buyer Validation**: Only the buyer who confirmed the purchase can review the offer
3. **Purchase Confirmation**: Reviews can only be created for offers that have been purchased (`wasPurchased = true`)
4. **Rating Range**: Ratings must be between 1 and 5 stars
5. **Ownership**: Users can only update/delete their own reviews
6. **Automatic Aggregation**: Seller ratings are automatically calculated and updated

## Validation Rules

- `offerId`: Must be a valid UUID and reference an existing offer
- `rating`: Must be an integer between 1 and 5
- `comment`: Optional text field (max length handled by database)
- `buyerId`: Automatically set from authenticated user

## Error Handling

The system provides comprehensive error handling for various scenarios:

- **404 Not Found**: When offer, user, or review doesn't exist
- **400 Bad Request**: Invalid input data, rating out of range, offer not purchased
- **403 Forbidden**: User trying to review offer they didn't purchase
- **409 Conflict**: Attempting to create duplicate review

## Testing

The module includes comprehensive test coverage:

- **Unit Tests**: Service and controller logic
- **Integration Tests**: End-to-end API testing
- **Validation Tests**: Input validation and error handling

Run tests with:
```bash
npm test -- --testPathPattern=seller-review
```

## Usage Examples

### Creating a Review
```typescript
const reviewData = {
  offerId: 'offer-uuid',
  rating: 5,
  comment: 'Excellent service and fast delivery!'
};

const review = await sellerReviewService.createReview(buyerId, reviewData);
```

### Getting Seller Reviews
```typescript
const sellerReviews = await sellerReviewService.getSellerReviews(sellerId);
console.log(`Average rating: ${sellerReviews.averageRating}`);
console.log(`Total reviews: ${sellerReviews.totalReviews}`);
```

### Updating a Review
```typescript
const updateData = {
  rating: 4,
  comment: 'Updated my rating after further consideration'
};

const updatedReview = await sellerReviewService.updateReview(
  reviewId, 
  buyerId, 
  updateData
);
```

## Database Migration

To apply the database changes, run the migration:

```bash
npm run migration:run
```

The migration will:
1. Create the `seller_reviews` table with proper constraints
2. Add seller rating columns to the `users` table
3. Create necessary indexes for performance

## Performance Considerations

- Indexes are created on frequently queried columns (`offer_id`, `buyer_id`, `created_at`)
- Seller rating aggregation is cached in the `users` table
- Queries use proper joins to minimize database round trips

## Security

- JWT authentication required for creating, updating, and deleting reviews
- Input validation prevents malicious data
- Foreign key constraints ensure data integrity
- Users can only modify their own reviews
