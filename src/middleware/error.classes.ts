// src/utils/AppError.ts
import { Response } from 'express';

export enum ErrorType {
  VALIDATION_ERROR = 'ValidationError',
  BAD_REQUEST_ERROR = 'BadRequestError',
  DATABASE_ERROR = 'DatabaseError',
  NOT_FOUND = 'NotFoundError',
  INTERNAL_ERROR = 'InternalError',
  UNAUTHORIZED = 'UnauthorizedError',
  FORBIDDEN = 'ForbiddenError',
  CONFLICT = 'ConflictError'
}

export abstract class AppError extends Error {
  public code: string;
  public status: number;
  public details: { field: string; error: string };

  /**
   * @param code - Error code
   * @param message - Descriptive error message
   * @param status - HTTP status code to return
   * @param details - Additional error details with "field" and "error" properties
   */
  constructor(
    code: string,
    message: string,
    status: number,
    details?: Partial<{ field: string; error: string }>
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = {
      field: details?.field || '',
      error: details?.error || '',
    };
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Static method to handle errors in a standardized way
   * @param err - The error to handle
   * @param res - Express response object
   */
  public static handle(err: AppError | Error, res: Response): Response {
    // Handle AppError instances
    if (err instanceof AppError) {
      return res.status(err.status).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details
        }
      });
    }
    
    // Handle other types of errors
    console.error('Unhandled error:', err);
    
    // Create a new InternalError with the error message
    const internalError = new InternalError(
      process.env.NODE_ENV === 'production' 
        ? undefined  // Use the default message in production
        : err.message || undefined
    );
    
    // Use the AppError handling for consistency
    return res.status(internalError.status).json({
      success: false,
      error: {
        code: internalError.code,
        message: internalError.message,
        details: internalError.details
      }
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Partial<{ field: string; error: string }>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Partial<{ field: string; error: string }>) {
    super('BAD_REQUEST_ERROR', message, 400, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Partial<{ field: string; error: string }>) {
    super('DATABASE_ERROR', message, 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Partial<{ field: string; error: string }>) {
    super('NOT_FOUND', message, 404, details);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Something went wrong', details?: Partial<{ field: string; error: string }>) {
    super('INTERNAL_ERROR', message, 500, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', details?: Partial<{ field: string; error: string }>) {
    super('UNAUTHORIZED', message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', details?: Partial<{ field: string; error: string }>) {
    super('FORBIDDEN', message, 403, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Partial<{ field: string; error: string }>) {
    super('CONFLICT', message, 409, details);
  }
}