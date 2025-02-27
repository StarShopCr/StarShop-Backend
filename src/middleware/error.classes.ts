export class AppError extends Error {
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
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Partial<{ field: string; error: string }>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Partial<{ field: string; error: string }>) {
    super('DATABASE_ERROR', message, 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Partial<{ field: string; error: string }>) {
    super('NOT_FOUND', message, 404, details);
  }
}
