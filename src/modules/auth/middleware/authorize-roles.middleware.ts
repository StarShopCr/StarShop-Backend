import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../../../types/role';

export const authorizeRoles = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const userRoles = req.user.role;
      const hasAllowedRole = userRoles.some((role) => allowedRoles.includes(role));

      if (!hasAllowedRole) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };
};
