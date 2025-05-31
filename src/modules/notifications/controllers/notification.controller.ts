import { Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { NotificationDto, UserNotificationDto } from '../dto/notification.dto';
import { UserRole } from '../../users/enums/user-role.enum';
import { AuthenticatedRequest } from '../../../types/auth-request.type';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private isAdmin(req: AuthenticatedRequest): boolean {
    if (!req.user) return false;

    const userRole = req.user.role;
    if (Array.isArray(userRole)) {
      return userRole.some((role) => role === UserRole.ADMIN);
    }
    return userRole === UserRole.ADMIN;
  }

  async sendToUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!this.isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can send notifications',
        });
      }

      const data: UserNotificationDto = req.body;
      const success = await this.notificationService.sendNotificationToUser(data);
      res.status(200).json({
        success,
        message: success ? 'Notification sent successfully' : 'Failed to send notification',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send notification',
      });
    }
  }

  async broadcast(req: AuthenticatedRequest, res: Response) {
    try {
      if (!this.isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can broadcast notifications',
        });
      }

      const data: NotificationDto = req.body;
      const success = await this.notificationService.broadcastNotification(data);
      res.status(200).json({
        success,
        message: success
          ? 'Notification broadcasted successfully'
          : 'Failed to broadcast notification',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to broadcast notification',
      });
    }
  }
}
