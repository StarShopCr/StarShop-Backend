import { Request } from 'express';
import { AuthRequest } from '../types/auth-request.type';  

interface MockRequestData extends Partial<Request> {
  user?: AuthRequest['user'];  // use the user type from AuthRequest
}

export const mockRequest = (data: MockRequestData = {}): Request => {
  return {
    ...data,
    user: {
      id: data.user?.id ?? 'test-user-id',
      walletAddress: data.user?.walletAddress ?? 'test-wallet',
      role: data.user?.role ?? [],
      name: data.user?.name,
      email: data.user?.email,
      createdAt: data.user?.createdAt,
      updatedAt: data.user?.updatedAt,
    },
  } as Request;
};