import { Request } from 'express';
import { Role } from '../../../types/role';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string | number;
    walletAddress: string;
    name?: string;
    email?: string;
    role: Role;
    location?: string;
    country?: string;
    buyerData?: any;
    sellerData?: any;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
