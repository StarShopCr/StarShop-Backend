import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import AppDataSource from '../../../config/ormconfig';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../../types/role';

const jwtService = new JwtService({ secret: process.env.JWT_SECRET });
const userRepository = AppDataSource.getRepository(User);

export const sessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const decoded = jwtService.verify(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await userRepository.findOne({
      where: { id: decoded.sub },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.userRoles.map((ur) => ur.role.name as Role),
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      res.status(401).json({
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
