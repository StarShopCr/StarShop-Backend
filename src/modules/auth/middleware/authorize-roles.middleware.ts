import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '@nestjs/common';

type RoleName = 'buyer' | 'seller' | 'admin';

export const authorizeRoles = (allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const userRole = req.user.role as RoleName;

      if (!allowedRoles.includes(userRole)) {
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
