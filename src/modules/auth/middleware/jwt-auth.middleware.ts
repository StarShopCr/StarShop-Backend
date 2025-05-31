import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../../../entities/User';
import AppDataSource from '../../../config/ormconfig';

export const jwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });

    const decoded = jwtService.verify(token);
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.sub } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.userRoles[0].role.name,
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
