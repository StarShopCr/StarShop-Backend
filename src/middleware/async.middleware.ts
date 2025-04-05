import { NextFunction, Request, Response } from 'express';

const asyncHandler =
  (fn) =>
  (req: Request, res: Response, next: NextFunction, ...rest: any[]) =>
    Promise.resolve(fn(req, res, next, ...rest)).catch(next);

export default asyncHandler;
