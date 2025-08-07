import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Determine status code
    const status = 
      exception instanceof HttpException 
        ? exception.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine error message
    let message = 'Internal server error';
    
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message || message;
      }
    } else if (exception.message) {
      message = exception.message;
    }

    // Format error response with global standard
    const errorResponse = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        error: exception.stack,
        timestamp: new Date().toISOString(),
      }),
    };

    response.status(status).json(errorResponse);
  }
}
