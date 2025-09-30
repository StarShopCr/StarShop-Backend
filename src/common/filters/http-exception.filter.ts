import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import logger from '../utils/logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const startTime = request?._startTime || Date.now();

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
        message = (exceptionResponse as { message?: string }).message || (exception as { message?: string }).message || message;
      }
    } else if (exception.message) {
      message = exception.message;
    }

    // Get controller and handler info for action logging
    const action = host.getType() === 'http'
      ? `${request?.route?.path || 'UnknownRoute'}:${request?.method || 'UNKNOWN'}`
      : 'UnknownAction';

    // Log error telemetry
    logger.error('RPC Error', {
      action,
      latency: Date.now() - startTime,
      success: false,
      method: request?.method,
      url: request?.originalUrl,
      error: message,
      stack: exception?.stack,
    });

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
