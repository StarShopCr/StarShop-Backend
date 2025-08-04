import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BuyerRequestsService } from '../services/buyer-requests.service';
import { BuyerRequest, BuyerRequestStatus } from '../entities/buyer-request.entity';
import { jest } from '@jest/globals';

describe('BuyerRequestsService', () => {
  let service: BuyerRequestsService;
  let repository: jest.Mocked<Repository<BuyerRequest>>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  } as unknown as jest.Mocked<SelectQueryBuilder<BuyerRequest>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  } as unknown as jest.Mocked<Repository<BuyerRequest>>;

  const createMockBuyerRequest = (overrides: Partial<BuyerRequest> = {}): BuyerRequest => ({
    id: 1,
    title: 'Test Request',
    description: 'Test Description',
    budgetMin: 100,
    budgetMax: 200,
    categoryId: 1,
    userId: 1,
    status: BuyerRequestStatus.OPEN,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    user: {
      id: 1,
      name: 'Test User',
      walletAddress: '0x123',
    } as any,
    offers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    searchVector: null,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyerRequestsService,
        {
          provide: getRepositoryToken(BuyerRequest),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BuyerRequestsService>(BuyerRequestsService);
    repository = module.get(getRepositoryToken(BuyerRequest));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- CREATE ---
  describe('create', () => {
    it('should create a buyer request successfully', async () => {
      const createDto = {
        title: 'Test Request',
        description: 'Test Description',
        budgetMin: 100,
        budgetMax: 200,
        categoryId: 1,
      };
      const userId = 1;
      const mockRequest = createMockBuyerRequest({ ...createDto, userId });

      mockRepository.create.mockReturnValue(mockRequest);
      mockRepository.save.mockResolvedValue(mockRequest);

      const result = await service.create(createDto, userId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
        expiresAt: expect.any(Date),
        status: BuyerRequestStatus.OPEN,
      });
      expect(result.title).toBe('Test Request');
    });

    it('should throw BadRequestException if budgetMin > budgetMax', async () => {
      await expect(
        service.create({ title: 'Invalid', budgetMin: 200, budgetMax: 100, categoryId: 1 }, 1)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if expiration date is in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await expect(
        service.create(
          {
            title: 'Expired',
            budgetMin: 100,
            budgetMax: 200,
            categoryId: 1,
            expiresAt: pastDate,
          },
          1
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  // --- FIND ALL ---
  describe('findAll', () => {
    beforeEach(() => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return paginated buyer requests', async () => {
      const mockRequests = [
        createMockBuyerRequest({ id: 1 }),
        createMockBuyerRequest({ id: 2 }),
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockRequests, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ search: 'web' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('to_tsvector'),
        expect.objectContaining({
          search: 'web',
          searchLike: '%web%',
        })
      );
    });

    it('should apply category filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ categoryId: 5 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('request.categoryId = :categoryId', {
        categoryId: 5,
      });
    });

    it('should apply budget filters', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ budgetMin: 100, budgetMax: 500 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('request.budgetMax >= :budgetMin', {
        budgetMin: 100,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('request.budgetMin <= :budgetMax', {
        budgetMax: 500,
      });
    });

    it('should apply expiringSoon filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ expiringSoon: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'request.expiresAt <= :threeDaysFromNow',
        { threeDaysFromNow: expect.any(Date) }
      );
    });

    it('should apply sorting', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ sortBy: 'budgetMin', sortOrder: 'ASC' });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('request.budgetMin', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('request.createdAt', 'DESC');
    });
  });

  // --- FIND ONE ---
  describe('findOne', () => {
    it('should return a buyer request', async () => {
      const mockRequest = createMockBuyerRequest({ id: 1 });
      mockRepository.findOne.mockResolvedValue(mockRequest);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.isExpiringSoon).toBe(false);
    });

    it('should detect expiring soon', async () => {
      const expiresSoon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const mockRequest = createMockBuyerRequest({ expiresAt: expiresSoon });
      mockRepository.findOne.mockResolvedValue(mockRequest);

      const result = await service.findOne(1);

      expect(result.isExpiringSoon).toBe(true);
      expect(result.daysUntilExpiry).toBe(2);
    });

    it('should throw if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // --- UPDATE ---
  describe('update', () => {
    it('should update buyer request', async () => {
      const mockRequest = createMockBuyerRequest({ id: 1 });
      mockRepository.findOne.mockResolvedValue(mockRequest);
      mockRepository.save.mockResolvedValue({ ...mockRequest, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' }, 1);

      expect(result.title).toBe('Updated');
    });

    it('should validate ownership', async () => {
      const mockRequest = createMockBuyerRequest({ userId: 1 });
      mockRepository.findOne.mockResolvedValue(mockRequest);
      await expect(service.update(1, {}, 2)).rejects.toThrow(ForbiddenException);
    });

    it('should reject update if closed', async () => {
      const mockRequest = createMockBuyerRequest({
        status: BuyerRequestStatus.CLOSED,
      });
      mockRepository.findOne.mockResolvedValue(mockRequest);
      await expect(service.update(1, {}, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should reject update if expired', async () => {
      const mockRequest = createMockBuyerRequest({
        expiresAt: new Date(Date.now() - 1000),
      });
      mockRepository.findOne.mockResolvedValue(mockRequest);
      await expect(service.update(1, {}, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should reject invalid budget update', async () => {
      const mockRequest = createMockBuyerRequest();
      mockRepository.findOne.mockResolvedValue(mockRequest);
      await expect(service.update(1, { budgetMin: 500, budgetMax: 100 }, 1)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // --- getSearchSuggestions ---
  describe('getSearchSuggestions', () => {
    it('should return suggestions', async () => {
      const mockSuggestions = [{ title: 'Web Development' }, { title: 'Web Design' }];
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawMany.mockResolvedValue(mockSuggestions);

      const result = await service.getSearchSuggestions('web');

      expect(result).toEqual(['Web Development', 'Web Design']);
    });

    it('should return [] for short query', async () => {
      const result = await service.getSearchSuggestions('a');
      expect(result).toEqual([]);
    });
  });

  // --- getPopularCategories ---
  describe('getPopularCategories', () => {
    it('should return category counts', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { categoryId: '1', count: '10' },
        { categoryId: '2', count: '5' },
      ]);

      const result = await service.getPopularCategories();

      expect(result).toEqual([
        { categoryId: 1, count: 10 },
        { categoryId: 2, count: 5 },
      ]);
    });
  });

  // --- closeRequest ---
  describe('closeRequest', () => {
    const mockOpenRequest = createMockBuyerRequest({
      id: 1,
      status: BuyerRequestStatus.OPEN,
      expiresAt: new Date('2024-12-31'),
    });

    const mockClosedRequest = {
      ...mockOpenRequest,
      status: BuyerRequestStatus.CLOSED,
    } as BuyerRequest;

    it('should close a buyer request successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockOpenRequest);
      mockRepository.save.mockResolvedValue(mockClosedRequest);

      const result = await service.closeRequest(1, 1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockOpenRequest,
        status: BuyerRequestStatus.CLOSED,
      });
      expect(result.status).toBe(BuyerRequestStatus.CLOSED);
    });

    it('should throw NotFoundException if request not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.closeRequest(999, 1)).rejects.toThrow('Buyer request not found');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockRepository.findOne.mockResolvedValue(mockOpenRequest);

      await expect(service.closeRequest(1, 999)).rejects.toThrow(
        'You can only close your own buyer requests'
      );
    });

    it('should throw BadRequestException if request is already closed', async () => {
      mockRepository.findOne.mockResolvedValue(mockClosedRequest);

      await expect(service.closeRequest(1, 1)).rejects.toThrow('Buyer request is already closed');
    });
  });
});
