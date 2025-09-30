import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export type Constructor<T> = new (...args: unknown[]) => T;

export const validateRequest = <T>(dtoClass: Constructor<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dtoObject = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoObject as object);
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errorMessages });
      return;
    }
    req.body = dtoObject as unknown as T;
    next();
  };
};

export const paramValidators = {
  id: (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ID parameter',
      });
    }
    next();
  },
};
