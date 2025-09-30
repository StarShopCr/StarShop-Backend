// import { User } from '../../entities/User';
// import { Request } from 'express';

// declare module 'express-serve-static-core' {
//   interface Request {
//     user?: {
//       id: number;
//       walletAddress: string;
//       role: User['role'];
//     };
//     fileProvider?: 'cloudinary' | 's3';
//     fileType?: string;
//   }
// }
import { Role } from '../types/role';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string | number; // Allow both string and number types
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
}

declare global {
  namespace Express {
    interface User {
      id: string;
      walletAddress: string;
      name?: string;
      email?: string;
      role: Role[];
      createdAt?: Date;
      updatedAt?: Date;
    }
  }
}

export interface AuthenticatedRequest extends Express.Request {
  user: Express.User;
}
