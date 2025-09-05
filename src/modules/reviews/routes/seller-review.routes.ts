import { Router } from 'express';
import { SellerReviewController } from '../controllers/seller-review.controller';
import { validateSellerReviewData } from '../middlewares/seller-review.middleware';
import { jwtAuthMiddleware } from '../../auth/middleware/jwt-auth.middleware';
import { AuthenticatedRequest } from '../../shared/types/auth-request.type';

const router = Router();
const sellerReviewController = new SellerReviewController();

/**
 * @route POST /api/v1/reviews
 * @desc Create a new review for a seller based on an offer
 * @access Private (Authenticated Users Only)
 */
router.post(
  '/',
  jwtAuthMiddleware,
  (req, res, next) => validateSellerReviewData(req as AuthenticatedRequest, res, next),
  (req, res, next) => sellerReviewController.createReview(req as AuthenticatedRequest, res, next)
);

/**
 * @route GET /api/v1/users/:id/reviews
 * @desc Get all reviews for a specific seller
 * @access Public
 */
router.get('/users/:id/reviews', (req, res, next) =>
  sellerReviewController.getSellerReviews(req as AuthenticatedRequest, res, next)
);

/**
 * @route PUT /api/v1/reviews/:id
 * @desc Update a review (only by the user who created it)
 * @access Private (Authenticated Users Only)
 */
router.put(
  '/:id',
  jwtAuthMiddleware,
  (req, res, next) => sellerReviewController.updateReview(req as AuthenticatedRequest, res, next)
);

/**
 * @route DELETE /api/v1/reviews/:id
 * @desc Delete a review (only by the user who created it)
 * @access Private (Authenticated Users Only)
 */
router.delete(
  '/:id',
  jwtAuthMiddleware,
  (req, res, next) => sellerReviewController.deleteReview(req as AuthenticatedRequest, res, next)
);

export default router;
