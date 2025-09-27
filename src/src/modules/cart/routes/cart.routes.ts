import { Router } from 'express';
import { jwtAuthMiddleware } from '../../auth/middleware/jwt-auth.middleware';
import { CartController } from '../controllers/cart.controller';
import { CartService } from '../services/cart.service';
import { AuthenticatedRequest } from '../../shared/types/auth-request.type';

const router = Router();
const cartService = new CartService();
const cartController = new CartController(cartService);

// Protected routes
router.use(jwtAuthMiddleware);
router.get('/', (req, res) => cartController.getCart(req as AuthenticatedRequest, res));
router.post('/items', (req, res) => cartController.addItem(req as AuthenticatedRequest, res));
router.put('/items/:id', (req, res) => cartController.updateItem(req as AuthenticatedRequest, res));
router.delete('/items/:id', (req, res) =>
  cartController.removeItem(req as AuthenticatedRequest, res)
);
router.delete('/', (req, res) => cartController.clearCart(req as AuthenticatedRequest, res));

export default router;
