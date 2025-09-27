import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const validateRequest = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dtoObject = plainToClass(dtoClass, req.body);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));

      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errorMessages,
      });

      return; // ✅ Solo return vacío
    }

    req.body = dtoObject;
    next(); // ✅ Deja continuar la cadena de middleware
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
