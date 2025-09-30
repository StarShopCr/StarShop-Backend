import { param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware';
import { Request, Response, NextFunction } from 'express';

export const paramValidators = {
  isPositiveInt: param('id').isInt({ min: 1 }).toInt(),
  // Agrega más validadores según sea necesario
};

export const paramValidationMiddleware = (validators: Record<string, unknown>): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return validateRequest(Object.values(validators));
};
