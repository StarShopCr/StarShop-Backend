import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        walletAddress: string;
        role: string;
    };
}

export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = AuthService.verifyToken(token);
        
        req.user = {
            userId: decoded.userId,
            walletAddress: decoded.walletAddress,
            role: decoded.role
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Optional: Role-based authentication middleware
export const requireRole = (role: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || req.user.role !== role) {
            throw new UnauthorizedError('Insufficient permissions');
        }
        next();
    };
};