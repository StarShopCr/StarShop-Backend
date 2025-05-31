import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validateRequest } from '../../../middleware/validate-request';
import { NotificationDto, UserNotificationDto } from '../dto/notification.dto';
import { NotificationService } from '../services/notification.service';
import { PusherConfig } from '../config/pusher.config';
import { AuthenticatedRequest } from '../../../types/auth-request.type';

const router = Router();
const notificationService = new NotificationService(new PusherConfig());
const notificationController = new NotificationController(notificationService);

router.post(
  '/send-to-user',
  validateRequest(UserNotificationDto),
  (req: AuthenticatedRequest, res) => notificationController.sendToUser(req, res)
);

router.post('/broadcast', validateRequest(NotificationDto), (req: AuthenticatedRequest, res) =>
  notificationController.broadcast(req, res)
);

export default router;
