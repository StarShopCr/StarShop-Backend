import Pusher from 'pusher';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationDto, UserNotificationDto } from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  private pusher: Pusher;
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly configService: ConfigService) {
    this.pusher = new Pusher({
      appId: this.configService.get<string>('PUSHER_APP_ID'),
      key: this.configService.get<string>('PUSHER_KEY'),
      secret: this.configService.get<string>('PUSHER_SECRET'),
      cluster: this.configService.get<string>('PUSHER_CLUSTER'),
    });
    this.logger.log('NotificationService initialized with Pusher config');
  }

  async sendNotificationToUser(data: UserNotificationDto): Promise<boolean> {
    try {
      const channel = `user-${data.userId}`;
      this.logger.log(`Attempting to send notification to channel: ${channel}`);

      await this.pusher.trigger(channel, 'notification', {
        title: data.title,
        message: data.message,
        type: data.type,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
      });

      this.logger.log(`Successfully sent notification to user ${data.userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending notification to user ${data.userId}:`, error);
      return false;
    }
  }

  async broadcastNotification(data: NotificationDto): Promise<boolean> {
    try {
      this.logger.log('Attempting to broadcast notification');

      await this.pusher.trigger('notifications', 'broadcast', {
        title: data.title,
        message: data.message,
        type: data.type,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
      });

      this.logger.log('Successfully broadcasted notification');
      return true;
    } catch (error) {
      this.logger.error('Error broadcasting notification:', error);
      return false;
    }
  }
}
