import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { jwtAuthMiddleware } from '../../auth/middleware/jwt-auth.middleware';
import { RoleService } from '../../auth/services/role.service';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/entities/user-role.entity';
import { JwtService } from '@nestjs/jwt';
import AppDataSource from '../../../config/ormconfig';

const router = Router();
const userService = new UserService();
const roleService = new RoleService(
  AppDataSource.getRepository(Role),
  AppDataSource.getRepository(UserRole)
);
const jwtService = new JwtService({ secret: process.env.JWT_SECRET });
const authService = new AuthService(userService, jwtService, roleService);
const userController = new UserController(userService, authService);

// Public routes
router.post('/', (req, res) => userController.createUser(req, res));

// Protected routes
router.get('/', jwtAuthMiddleware, (req, res) => userController.getAllUsers(req, res));
router.get('/:id', jwtAuthMiddleware, (req, res) => userController.getUserById(req, res));
router.put('/update/:id', jwtAuthMiddleware, (req, res) => userController.updateUser(req, res));

export default router;
