import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { BuyerRequestSchedulerService } from '../services/buyer-request-scheduler.service';
import { BuyerRequest, BuyerRequestStatus } from '../entities/buyer-request.entity';

describe('BuyerRequestSchedulerService', () => {
  let service: BuyerRequestSchedulerService;
  let repository: jest.Mocked<Repository<BuyerRequest>>;

  const mockExpiredRequest1 = {
    id: 1,
    title: 'Expired Request 1',
    status: BuyerRequestStatus.OPEN,
    expiresAt: new Date('2023-01-01'),
  } as BuyerRequest;

  const mockExpiredRequest2 = {
    id: 2,
    title: 'Expired Request 2',
    status: BuyerRequestStatus.OPEN,
    expiresAt: new Date('2023-01-02'),
  } as BuyerRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyerRequestSchedulerService,
        {
          provide: getRepositoryToken(BuyerRequest),
          useValue: {
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BuyerRequestSchedulerService>(BuyerRequestSchedulerService);
    repository = module.get(getRepositoryToken(BuyerRequest));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleExpiredRequests', () => {
    it('should close expired requests successfully', async () => {
      const expiredRequests = [mockExpiredRequest1, mockExpiredRequest2];
      repository.find.mockResolvedValue(expiredRequests);
      repository.update.mockResolvedValue({ affected: 2, raw: [], generatedMaps: [] });

      await service.handleExpiredRequests();

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          status: BuyerRequestStatus.OPEN,
          expiresAt: expect.any(Object), // LessThan matcher
        },
      });

      expect(repository.update).toHaveBeenCalledWith(
        {
          status: BuyerRequestStatus.OPEN,
          expiresAt: expect.any(Object), // LessThan matcher
        },
        { status: BuyerRequestStatus.CLOSED }
      );
    });

    it('should handle case when no expired requests found', async () => {
      repository.find.mockResolvedValue([]);

      await service.handleExpiredRequests();

      expect(repository.find).toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      repository.find.mockRejectedValue(error);

      // Should not throw an error
      await expect(service.handleExpiredRequests()).resolves.toBeUndefined();

      expect(repository.find).toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('closeExpiredRequests', () => {
    it('should manually close expired requests and return count', async () => {
      repository.update.mockResolvedValue({ affected: 3, raw: [], generatedMaps: [] });

      const result = await service.closeExpiredRequests();

      expect(result).toBe(3);
      expect(repository.update).toHaveBeenCalledWith(
        {
          status: BuyerRequestStatus.OPEN,
          expiresAt: expect.any(Object), // LessThan matcher
        },
        { status: BuyerRequestStatus.CLOSED }
      );
    });

    it('should return 0 when no requests to close', async () => {
      repository.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      const result = await service.closeExpiredRequests();

      expect(result).toBe(0);
    });

    it('should throw error when database operation fails', async () => {
      const error = new Error('Database update failed');
      repository.update.mockRejectedValue(error);

      await expect(service.closeExpiredRequests()).rejects.toThrow(error);
    });
  });
});
