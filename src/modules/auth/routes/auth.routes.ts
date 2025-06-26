import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserService } from '../../users/services/user.service';
import { RoleService } from '../services/role.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import AppDataSource from '../../../config/ormconfig';

const router = Router();
const userService = new UserService();
const roleService = new RoleService(
  AppDataSource.getRepository(Role),
  AppDataSource.getRepository(UserRole)
);
const jwtService = new JwtService({ secret: process.env.JWT_SECRET });
const authService = new AuthService(userService, jwtService, roleService);
const authController = new AuthController(authService);

// Public routes - Stellar wallet authentication
router.post('/challenge', (req, res) => authController.generateChallenge(req, res));
router.post('/login', (req, res) => authController.loginWithWallet(req, res));
router.post('/register', (req, res) => authController.registerWithWallet(req, res));

// Protected routes
router.get('/me', jwtAuthMiddleware, (req, res) => authController.getMe(req, res));
router.delete('/logout', jwtAuthMiddleware, (req, res) => authController.logout(req, res));

export default router;
