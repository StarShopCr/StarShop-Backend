import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // If response already has the standard format, return it as is
        if (data && typeof data === 'object' && 'success' in data) {
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

        return formattedResponse;
      }),
    );
  }
}
