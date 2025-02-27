// errors.ts - Custom Error Classes

// UnauthorizedError
// Used when someone tries to access something they're not allowed to
// Like trying to enter a VIP area without a VIP pass
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message); // Sends the message to the parent Error class
    this.name = 'UnauthorizedError'; // Gives our error a specific name
  }
}

// ValidationError
// Used when the data provided isn't in the correct format
// Like when someone types letters in a phone number field
export class ValidationError extends Error {
  constructor(message: string = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

// NotFoundError
// Used when we try to find something that doesn't exist
// Like trying to find a page that was deleted
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// BadRequestError
// Used when a request is incorrectly formatted
// Like sending an empty form when all fields are required
export class BadRequestError extends Error {
  constructor(message: string = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

// ReferenceValidationError
// Used when a reference to another piece of data is invalid
// Like trying to like a post that doesn't exist anymore
export class ReferenceValidationError extends Error {
  constructor(message: string = 'Invalid reference') {
    super(message);
    this.name = 'ReferenceValidationError';
  }
}
