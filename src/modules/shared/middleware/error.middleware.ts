/* eslint-disable no-unused-vars */
import winston from 'winston';
import { Request, Response } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { HttpException } from '@nestjs/common';

const files = new winston.transports.File({ filename: 'logs/error.log' });
winston.add(files);

const errorHandler = (err: any, req: Request, res: Response) => {
  const error = { ...err };
  error.message = err.message;

  process.env.NODE_ENV !== 'TEST' && console.log((err as any).stack);
  if (err instanceof AppError) {
    const status = err instanceof HttpException ? err.getStatus() : 500;
    return res.status(status).json({
      statusCode: status,
      message: err.message,
      error: err.name,
    });
  } else {
    if (err.name === 'CastError') {
      return res.status(404).json({
        statusCode: 404,
        message: 'Resource not found',
        error: 'NotFoundError',
      });
    }

    if ((err as any).code === 11000) {
      let field = err.message.split('index:')[1];
      field = field.split(' dup key')[0];
      field = field.substring(0, field.lastIndexOf('_')).trim();
      const message = `${field} already exists`;
      return res.status(400).json({
        statusCode: 400,
        message,
        error: 'BadRequestError',
      });
    }

    if (err.name === 'ValidationError') {
      const message: string = Object.values((err as any).errors)
        .map((val: any): string => val.message)
        .join(', ');
      return res.status(400).json({
        statusCode: 400,
        message,
        error: 'BadRequestError',
      });
    }

    if (error.message === 'Route Not found') {
      return res.status(404).json({
        statusCode: 404,
        message: 'Requested resource not found',
        error: 'NotFoundError',
      });
    }

    winston.error(err.stack);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'InternalError',
    });
  }
};

export const errorHandlerNest = (error: Error, req: Request, res: Response) => {
  if (error instanceof HttpException) {
    return res.status(error.getStatus()).json({
      statusCode: error.getStatus(),
      message: error.message,
      error: error.name,
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      statusCode: 400,
      message: error.message,
      error: 'Validation Error',
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    error: 'Internal Server Error',
  });
};

export default errorHandler;
