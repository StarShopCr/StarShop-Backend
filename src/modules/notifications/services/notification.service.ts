import Pusher from 'pusher';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDto, UserNotificationDto } from '../dto/notification.dto';
import { Notification } from '../entities/notification.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class NotificationService {
  private pusher: Pusher;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.pusher = new Pusher({
      appId: this.configService.get<string>('PUSHER_APP_ID'),
      key: this.configService.get<string>('PUSHER_KEY'),
      secret: this.configService.get<string>('PUSHER_SECRET'),
      cluster: this.configService.get<string>('PUSHER_CLUSTER'),
    });
    this.logger.log('NotificationService initialized with Pusher config');
  }

  /**
   * Crea notificación en DB y envía via Pusher con deduplicación
   */
  async createAndSendNotificationToUser(data: UserNotificationDto): Promise<boolean> {
    try {
      // 1. Verificar deduplicación si se proporciona entityId
      if (data.entityId) {
        const existingNotification = await this.notificationRepository.findOne({
          where: {
            entityId: data.entityId,
            type: data.type,
            user: { id: data.userId },
          },
        });

        if (existingNotification) {
          this.logger.log(`Notification already exists for entityId: ${data.entityId}, type: ${data.type}, userId: ${data.userId}`);
          return true; // No es error, simplemente ya existe
        }
      }

      // 2. Obtener el usuario
      const user = await this.userRepository.findOne({
        where: { id: data.userId },
      });

      if (!user) {
        this.logger.error(`User not found: ${data.userId}`);
        return false;
      }

      // 3. Crear notificación en DB
      const notification = this.notificationRepository.create({
        title: data.title,
        message: data.message,
        type: data.type,
        payload: data.payload,
        entityId: data.entityId,
        user: user,
      });

      const savedNotification = await this.notificationRepository.save(notification);
      this.logger.log(`Notification saved to DB with ID: ${savedNotification.id}`);

      // 4. Enviar via Pusher
      const pusherSuccess = await this.sendNotificationToUser({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        payload: data.payload,
      });

      return pusherSuccess;
    } catch (error) {
      this.logger.error(`Error creating and sending notification:`, error);
      return false;
    }
  }

  /**
   * Envía notificación solo via Pusher (método original)
   */
  async sendNotificationToUser(data: UserNotificationDto): Promise<boolean> {
    try {
      const channel = `user-${data.userId}`;
      this.logger.log(`Attempting to send notification to channel: ${channel}`);
      
      await this.pusher.trigger(channel, 'notification', {
        title: data.title,
        message: data.message,
        type: data.type,
        payload: data.payload,
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
        payload: data.payload,
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

  /**
   * Obtener notificaciones de un usuario (para el frontend)
   */
  async getUserNotifications(userId: string, page = 1, limit = 20): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { notifications, total };
  }
}