import { Router, Request, Response, NextFunction } from 'express';
import { RoleController } from '../controllers/role.controller';
import { RoleService } from '../services/role.service';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { authorizeRoles } from '../middleware/authorize-roles.middleware';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import AppDataSource from '../../../config/ormconfig';

// Define proper middleware type that matches Express's expectations
type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

const router = Router();
const roleService = new RoleService(
  AppDataSource.getRepository(Role),
  AppDataSource.getRepository(UserRole)
);
const roleController = new RoleController(roleService);

// Apply JWT auth middleware to all routes
router.use(jwtAuthMiddleware as unknown as ExpressMiddleware);

// Assign role to user (admin only)
router.post(
  '/assign-role',
  authorizeRoles(['admin']) as unknown as ExpressMiddleware,
  roleController.assignRole.bind(roleController)
);

// Get current user's roles
router.get('/me/roles', roleController.getMyRoles.bind(roleController));

export default router;
