import { Request } from 'express';
import { UserRole } from '../modules/users/enums/user-role.enum';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string | number;
    role: UserRole | UserRole[];
    walletAddress?: string;
    email?: string;
  };
}
