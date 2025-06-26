import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '../../../types/role';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.some((role) => user.role.includes(role));
  }
}

// Express middleware version for non-NestJS routes
export const requireRole = (requiredRole: Role) => {
  return (req: Request, res: any, next: any) => {
    const user = req.user;

    if (!user || !user.role) {
      return res.status(403).json({ success: false, message: 'Access denied. Role required.' });
    }

    if (!user.role.includes(requiredRole)) {
      return res
        .status(403)
        .json({ success: false, message: `Access denied. ${requiredRole} role required.` });
    }

    next();
  };
};
