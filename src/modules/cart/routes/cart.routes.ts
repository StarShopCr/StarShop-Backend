import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();

router.use(authMiddleware);

// Cart routes
router.get('/', (req, res: Response) => cartController.getCart(req as AuthenticatedRequest, res));
router.post('/add', (req, res: Response) =>
  cartController.addItem(req as AuthenticatedRequest, res)
);
router.post('/remove', (req, res: Response) =>
  cartController.removeItem(req as AuthenticatedRequest, res)
);
router.post('/clear', (req, res: Response) =>
  cartController.clearCart(req as AuthenticatedRequest, res)
);

export default router;
