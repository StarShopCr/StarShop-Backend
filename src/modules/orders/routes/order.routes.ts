import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';
import { authMiddleware } from '../../../middleware/auth.middleware';
import AppDataSource from '../../../config/ormconfig';
import { Order } from '../entities/order.entity';

const router = Router();
const orderService = new OrderService(AppDataSource.getRepository(Order));
const orderController = new OrderController(orderService);

// Apply auth middleware to all routes
router.use('/', authMiddleware);

// Get all orders for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const orders = await orderController.getOrders(req);
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get specific order details
router.get('/:id', async (req, res, next) => {
  try {
    const order = await orderController.getOrderDetails(req.params.id, req);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
