import { Test, TestingModule } from '@nestjs/testing';
import { authorizeRoles } from '../../../modules/auth/middleware/authorize-roles.middleware';
import { Request, Response, NextFunction } from 'express';

describe('authorizeRoles', () => {
  let middleware: ReturnType<typeof authorizeRoles>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = authorizeRoles(['admin']);
    mockRequest = {
      user: {
        id: 1,
        walletAddress: '0x123',
        role: 'admin',
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  // Add your specific test cases here
});
