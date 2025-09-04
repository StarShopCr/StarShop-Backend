import { Request } from 'express';
import { Role } from './role';

export interface AppUser {
  id: string; // UUID
  walletAddress: string;
  name?: string;
  email?: string;
  role: Role[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string; // UUID
    walletAddress: string;
    name?: string;
    email?: string;
    role: Role[];
    createdAt?: Date;
    updatedAt?: Date;
  };
  fileProvider?: 'cloudinary' | 's3';
  fileType?: string;
}
