import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * A validation middleware for validating request body data against a DTO class.
 * @param dtoClass The DTO class to validate against.
 */
export function validationMiddleware(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dtoInstance = plainToInstance(dtoClass, req.body);
    const errors: ValidationError[] = await validate(dtoInstance);

    if (errors.length > 0) {
      const errorDetails = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));

      res.status(422).json({
        message: 'Validation failed',
        errors: errorDetails,
      });
    } else {
      next();
    }
  };
}
