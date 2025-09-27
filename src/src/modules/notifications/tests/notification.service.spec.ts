import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../services/notification.service';
import { NotificationDto, UserNotificationDto } from '../dto/notification.dto';
import { ConfigService } from '@nestjs/config';
// import Pusher from 'pusher';

// Create mock Pusher instance
const mockTrigger = jest.fn().mockResolvedValue(undefined);
const mockPusher = {
  trigger: mockTrigger,
};

// Mock Pusher constructor
jest.mock('pusher', () => {
  return jest.fn().mockImplementation(() => mockPusher);
});

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    // Clear mock calls
    mockTrigger.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                PUSHER_APP_ID: 'test-app-id',
                PUSHER_KEY: 'test-key',
                PUSHER_SECRET: 'test-secret',
                PUSHER_CLUSTER: 'test-cluster',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotificationToUser', () => {
    it('should send notification to specific user', async () => {
      const notification: UserNotificationDto = {
        userId: '123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
      };

      const result = await service.sendNotificationToUser(notification);

      expect(mockTrigger).toHaveBeenCalledWith(
        `user-${notification.userId}`,
        'notification',
        expect.objectContaining({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          timestamp: expect.any(String),
        })
      );
      expect(result).toBe(true);
    });

    it('should handle Pusher errors', async () => {
      const notification: UserNotificationDto = {
        userId: '123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
      };

      mockTrigger.mockRejectedValueOnce(new Error('Pusher error'));

      const result = await service.sendNotificationToUser(notification);

      expect(result).toBe(false);
    });
  });

  describe('broadcastNotification', () => {
    it('should broadcast notification to all users', async () => {
      const notification: NotificationDto = {
        title: 'Test',
        message: 'Test message',
        type: 'info',
      };

      const result = await service.broadcastNotification(notification);

      expect(mockTrigger).toHaveBeenCalledWith(
        'notifications',
        'broadcast',
        expect.objectContaining({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          timestamp: expect.any(String),
        })
      );
      expect(result).toBe(true);
    });

    it('should handle Pusher errors during broadcast', async () => {
      const notification: NotificationDto = {
        title: 'Test',
        message: 'Test message',
        type: 'info',
      };

      mockTrigger.mockRejectedValueOnce(new Error('Pusher error'));

      const result = await service.broadcastNotification(notification);

      expect(result).toBe(false);
    });
  });
});
