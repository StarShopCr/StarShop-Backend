import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';
import { NotificationDto, UserNotificationDto } from '../dto/notification.dto';
import { UserRole } from '../../users/enums/user-role.enum';
import { AuthenticatedRequest } from '../../../types/auth-request.type';
import { Response } from 'express';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const mockService = {
      sendNotificationToUser: jest.fn().mockResolvedValue(true),
      broadcastNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendToUser', () => {
    it('should send notification to user when user is admin', async () => {
      const req = {
        user: { role: [UserRole.ADMIN] },
        body: {
          userId: '123',
          title: 'Test',
          message: 'Test message',
          type: 'info',
        },
      } as AuthenticatedRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.sendToUser(req, res);

      expect(service.sendNotificationToUser).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification sent successfully',
      });
    });

    it('should return 403 when user is not admin', async () => {
      const req = {
        user: { role: [UserRole.USER] },
        body: {
          userId: '123',
          title: 'Test',
          message: 'Test message',
          type: 'info',
        },
      } as AuthenticatedRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.sendToUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can send notifications',
      });
    });
  });

  describe('broadcast', () => {
    it('should broadcast notification when user is admin', async () => {
      const req = {
        user: { role: [UserRole.ADMIN] },
        body: {
          title: 'Test',
          message: 'Test message',
          type: 'info',
        },
      } as AuthenticatedRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.broadcast(req, res);

      expect(service.broadcastNotification).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification broadcasted successfully',
      });
    });

    it('should return 403 when user is not admin', async () => {
      const req = {
        user: { role: [UserRole.USER] },
        body: {
          title: 'Test',
          message: 'Test message',
          type: 'info',
        },
      } as AuthenticatedRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.broadcast(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can broadcast notifications',
      });
    });
  });
});
