import { Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateSellerReviewDTO, UpdateSellerReviewDTO } from '../dto/seller-review.dto';
import { BadRequestError } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../shared/types/auth-request.type';

export const validateSellerReviewData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = plainToClass(CreateSellerReviewDTO, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      
      throw new BadRequestError(`Validation failed: ${errorMessages}`);
    }

    // Additional validation for rating range
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    // Validate offerId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dto.offerId)) {
      throw new BadRequestError('Invalid offer ID format');
    }

    req.body = dto;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateSellerReviewData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = plainToClass(UpdateSellerReviewDTO, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      
      throw new BadRequestError(`Validation failed: ${errorMessages}`);
    }

    // Additional validation for rating range if provided
    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    req.body = dto;
    next();
  } catch (error) {
    next(error);
  }
};
