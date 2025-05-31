import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { canReviewProduct, validateReviewData } from '../middlewares/review.middleware';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();
const reviewController = new ReviewController();

/**
 * @route POST /api/v1/reviews/:productId
 * @desc Create a new review for a product
 * @access Private (Authenticated Users Only)
 */
router.post(
  '/:productId',
  authMiddleware,
  canReviewProduct,
  validateReviewData,
  reviewController.createReview
);

/**
 * @route GET /api/v1/reviews/:productId
 * @desc Get all reviews for a product
 * @access Public
 */
router.get('/:productId', reviewController.getProductReviews);

/**
 * @route DELETE /api/v1/reviews/:reviewId
 * @desc Delete a review (only by the user who created it)
 * @access Private (Authenticated Users Only)
 */
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

export default router;
