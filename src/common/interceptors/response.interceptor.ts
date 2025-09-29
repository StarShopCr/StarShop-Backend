import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import logger from '../utils/logger';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest();
    const startTime = Date.now();

    // Get controller and handler info for action logging
    const handler = context.getHandler();
    const controller = context.getClass();
    const action = `${controller?.name || 'UnknownController'}.${handler?.name || 'unknownMethod'}`;

    return next.handle().pipe(
      map((data) => {
        // If response already has the standard format, return it as is
        if (data && typeof data === 'object' && 'success' in data) {
          logger.info('RPC Success', {
            action,
            latency: Date.now() - startTime,
            success: true,
            method: req?.method,
            url: req?.originalUrl,
          });
          return data;
        }

        // Extract token from res.locals if available
        const token = res?.locals?.token;

        // Format response with global standard
        const formattedResponse: any = {
          success: true,
          data,
        };

        // Include token only if it exists
        if (token) {
          formattedResponse.token = token;
        }

        logger.info('RPC Success', {
          action,
          latency: Date.now() - startTime,
          success: true,
          method: req?.method,
          url: req?.originalUrl,
        });
        return formattedResponse;
      }),
      tap({
        error: (err) => {
          logger.error('RPC Error', {
            action,
            latency: Date.now() - startTime,
            success: false,
            method: req?.method,
            url: req?.originalUrl,
            error: err?.message,
            stack: err?.stack,
          });
        },
      })
    );
  }
}
