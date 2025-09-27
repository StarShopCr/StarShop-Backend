// src/middleware/validationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationError } from '../utils/errors';
import { ParamsDictionary } from 'express-serve-static-core';

/**
 * Middleware to validate request data against a DTO class
 * @param type - The DTO class to validate against
 * @param skipMissingProperties - Whether to skip validation for missing properties (useful for PATCH requests)
 * @returns Express middleware function
 */
export const validationMiddleware = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObject = plainToClass(dtoClass, req.body) as object;
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => {
        return {
          property: error.property,
          constraints: error.constraints,
        };
      });

      throw new ValidationError(JSON.stringify(errorMessages));
    }

    req.body = dtoObject;
    next();
  };
};

/**
 * Middleware to validate request parameters
 * @param schema - Validation schema for parameters
 * @returns Express middleware function
 */
export const paramValidationMiddleware = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObject = plainToClass(dtoClass, req.params) as ParamsDictionary;
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => {
        return {
          property: error.property,
          constraints: error.constraints,
        };
      });

      throw new ValidationError(JSON.stringify(errorMessages));
    }

    req.params = dtoObject;
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
