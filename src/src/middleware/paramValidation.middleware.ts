import { param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware';

export const paramValidators = {
  isPositiveInt: param('id').isInt({ min: 1 }).toInt(),
  // Agrega más validadores según sea necesario
};

export const paramValidationMiddleware = (validators: Record<string, any>) => {
  return validateRequest(Object.values(validators));
};
