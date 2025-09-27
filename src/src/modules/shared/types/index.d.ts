import { UserRole } from '../../modules/users/enums/user-role.enum';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | number;
        walletAddress?: string;
        role: UserRole | UserRole[];
        email?: string;
      };
    }
  }
}
