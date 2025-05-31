import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';

/**
 * Middleware to validate if a user can review a product
 * Note: Since there's no order system yet, this is a placeholder that will
 * allow all authenticated users to submit reviews for now
 */
export const canReviewProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;

    if (!userId) {
      throw new BadRequestError('User must be authenticated to leave a review');
    }

    // Get product ID from route parameter
    const productId = parseInt(req.params.productId, 10);

    if (isNaN(productId)) {
      throw new BadRequestError('Invalid product ID');
    }

    // When an order system is implemented, check if the user has purchased the product
    // For now, allow all authenticated users to submit reviews

    req.body.userId = userId;
    req.body.productId = productId;

    next();
  } catch (error) {
    next(error);
  }
};

//Middleware to validate the review data

export const validateReviewData = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rating, comment } = req.body;

    if (rating === undefined || rating === null) {
      throw new BadRequestError('Rating is required');
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new BadRequestError('Rating must be a number between 1 and 5');
    }

    if (comment !== undefined && comment !== null && typeof comment !== 'string') {
      throw new BadRequestError('Comment must be a string');
    }

    next();
  } catch (error) {
    next(error);
  }
};
