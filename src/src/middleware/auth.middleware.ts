import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth-request.type';
import { Role } from '../types/role';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Implementación del middleware
  next();
};

export const requireRole = (roleName: Role) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role.includes(roleName)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
