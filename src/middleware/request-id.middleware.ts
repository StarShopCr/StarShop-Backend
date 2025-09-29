import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let requestId = req.headers[REQUEST_ID_HEADER] as string;
    if (!requestId) {
      requestId = randomUUID();
      req.headers[REQUEST_ID_HEADER] = requestId;
    }
    res.setHeader(REQUEST_ID_HEADER, requestId);
    // Attach to request object for downstream usage
    (req as any).requestId = requestId;
    next();
  }
}
