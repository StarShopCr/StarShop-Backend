import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RoleService } from '../services/role.service';
import { Role } from '../../../types/role';

/**
 * Interface for extending the Express Request type
 * Adds user information to the request object after authentication
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    walletAddress: string;
    name?: string;
    email?: string;
    role: Role;
    createdAt?: Date;
    updatedAt?: Date;
  };
  fileProvider?: 'cloudinary' | 's3';
  fileType?: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService
  ) {}

  public mapRoleToEnum(roleName: string): Role {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return Role.ADMIN;
      case 'seller':
        return Role.SELLER;
      case 'buyer':
      case 'user':
        return Role.BUYER;
      default:
        return Role.BUYER;
    }
  }

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('No authorization header');
      }

      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer') {
        throw new UnauthorizedException('Invalid authorization type');
      }

      const decoded = this.jwtService.verify(token);
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      const userRoles = await this.roleService.getUserRoles(decoded.id);
      // Get the primary role (first one) instead of an array
      const primaryRole = userRoles.length > 0 ? this.mapRoleToEnum(userRoles[0].name) : Role.BUYER;
      req.user = { ...decoded, role: primaryRole };

      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

/**
 * Role-based Access Control Middleware
 * Checks if the authenticated user has the required role
 * Must be used after authMiddleware
 */
export const requireRole = (
  roleName: 'buyer' | 'seller' | 'admin'
): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => void) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requiredRole = new AuthMiddleware(null, null).mapRoleToEnum(roleName);
    if (!req.user || req.user.role !== requiredRole) {
      throw new ReferenceError('Insufficient permissions');
    }
    next();
  };
};
