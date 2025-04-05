// src/middleware/validationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationError } from './error.classes';

/**
 * Middleware to validate request data against a DTO class
 * @param type - The DTO class to validate against
 * @param skipMissingProperties - Whether to skip validation for missing properties (useful for PATCH requests)
 * @returns Express middleware function
 */
export const validationMiddleware = (type: any, skipMissingProperties = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Convert plain object to class instance
    const dtoObject = plainToClass(type, req.body);

    // Validate against the DTO
    validate(dtoObject, { skipMissingProperties }).then((errors) => {
      if (errors.length > 0) {
        // Extract the first error for field and message details
        const firstError = errors[0];
        const field = firstError.property;
        const errorMessage = Object.values(firstError.constraints || {})[0] || 'Validation failed';

        // Collect all errors for a complete message
        const allErrors = errors
          .map((error) => {
            const property = error.property;
            const constraints = Object.values(error.constraints || {}).join(', ');
            return `${property}: ${constraints}`;
          })
          .join('; ');

        // Create and pass a validation error
        const validationError = new ValidationError(allErrors, { field, error: errorMessage });

        return next(validationError);
      }

      // If validation passes, update req.body with the validated and transformed object
      req.body = dtoObject;
      next();
    });
  };
};

/**
 * Middleware to validate request parameters
 * @param schema - Validation schema for parameters
 * @returns Express middleware function
 */
export const paramValidationMiddleware = (schema: Record<string, (value: string) => boolean>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate each parameter against its validation function
    Object.entries(schema).forEach(([param, validationFn]) => {
      const value = req.params[param];

      if (value === undefined) {
        errors.push(`Parameter '${param}' is required`);
      } else if (!validationFn(value)) {
        errors.push(`Parameter '${param}' failed validation`);
      }
    });

    if (errors.length > 0) {
      return next(
        new ValidationError(errors.join('; '), {
          field: 'params',
          error: errors[0],
        })
      );
    }

    next();
  };
};

/**
 * Common parameter validation functions
 */
export const paramValidators = {
  isUUID: (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  isInt: (value: string) => /^-?\d+$/.test(value),
  isPositiveInt: (value: string) => /^\d+$/.test(value) && parseInt(value) > 0,
  isAlphanumeric: (value: string) => /^[a-z0-9]+$/i.test(value),
  isSlug: (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value),
  isHexAddress: (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value),
};
