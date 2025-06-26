import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { jwtAuthMiddleware } from '../../auth/middleware/jwt-auth.middleware';

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

router.post('/', (req, res) => userController.createUser(req, res));
router.put('/update/:id', jwtAuthMiddleware, (req, res) =>
  userController.updateUser(req, res)
);

export default router;
