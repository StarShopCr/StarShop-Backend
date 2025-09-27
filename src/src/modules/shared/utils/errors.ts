// errors.ts - Custom Error Classes

import { HttpException, HttpStatus } from '@nestjs/common';

// AppError
// Used when a request is incorrectly formatted
// Like sending an empty form when all fields are required
export class AppError extends HttpException {
  constructor(message: string, statusCode: HttpStatus) {
    super(message, statusCode);
  }
}

// BadRequestError
// Used when a request is incorrectly formatted
// Like sending an empty form when all fields are required
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

// UnauthorizedError
// Used when someone tries to access something they're not allowed to
// Like trying to enter a VIP area without a VIP pass
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

// ForbiddenError
// Used when a request is incorrectly formatted
// Like sending an empty form when all fields are required
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

// NotFoundError
// Used when we try to find something that doesn't exist
// Like trying to find a page that was deleted
export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

// ValidationError
// Used when the data provided isn't in the correct format
// Like when someone types letters in a phone number field
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

// InternalError
// Used when a request is incorrectly formatted
// Like sending an empty form when all fields are required
export class InternalError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// ReferenceValidationError
// Used when a reference to another piece of data is invalid
// Like trying to like a post that doesn't exist anymore
export class ReferenceValidationError extends BadRequestError {
  constructor(message: string = 'Invalid reference') {
    super(message);
  }
}
