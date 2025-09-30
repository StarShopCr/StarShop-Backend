import { param, ValidationChain } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware';

export const paramValidators = {
  isPositiveInt: param('id').isInt({ min: 1 }).toInt(),
  // Add more validators as needed
};

export const paramValidationMiddleware = (validators: Record<string, ValidationChain>) =>
  validateRequest(Object.values(validators));
