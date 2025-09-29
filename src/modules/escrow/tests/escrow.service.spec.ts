import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EscrowService } from '../services/escrow.service';
import { EscrowAccount } from '../entities/escrow-account.entity';
import { Milestone } from '../entities/milestone.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { EscrowStatus } from '../enums/escrow-status.enum';
import { MilestoneStatus } from '../enums/milestone-status.enum';
import { ReleaseFundsDto, ReleaseFundsType } from '../dto/release-funds.dto';
import { ApproveMilestoneDto } from '../dto/approve-milestone.dto';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('EscrowService', () => {
  let service: EscrowService;
  let escrowRepository: jest.Mocked<Repository<EscrowAccount>>;
  let milestoneRepository: jest.Mocked<Repository<Milestone>>;
  let offerRepository: jest.Mocked<Repository<Offer>>;
  let dataSource: jest.Mocked<DataSource>;
  let transactionManager: any;

  const mockBuyerId = 1;
  const mockSellerId = 2;
  const mockOfferId = 'offer-uuid-123';
  const mockMilestoneId = 'milestone-uuid-456';
  const mockEscrowId = 'escrow-uuid-789';

  const mockEscrowAccount: EscrowAccount = {
    id: mockEscrowId,
    offerId: mockOfferId,
    buyerId: mockBuyerId,
    sellerId: mockSellerId,
    totalAmount: 1000,
    releasedAmount: 0,
    status: EscrowStatus.FUNDED,
    milestones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as EscrowAccount;

  const mockMilestone: Milestone = {
    id: mockMilestoneId,
    escrowAccountId: mockEscrowId,
    title: 'Development Phase 1',
    description: 'Complete initial setup',
    amount: 500,
    status: MilestoneStatus.APPROVED,
    buyerApproved: true,
    approvedAt: new Date(),
    releasedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    escrowAccount: mockEscrowAccount,
  } as Milestone;

  const mockUnapprovedMilestone: Milestone = {
    ...mockMilestone,
    id: 'milestone-uuid-unapproved',
    status: MilestoneStatus.PENDING,
    buyerApproved: false,
    approvedAt: null,
  };

  const mockReleasedMilestone: Milestone = {
    ...mockMilestone,
    id: 'milestone-uuid-released',
    status: MilestoneStatus.RELEASED,
    releasedAt: new Date(),
  };

  beforeEach(async () => {
    // Create mock repositories
    const mockEscrowRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockMilestoneRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockOfferRepo = {
      findOne: jest.fn(),
    };

    // Create mock transaction manager
    transactionManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    // Create mock DataSource
    const mockDataSource = {
      transaction: jest.fn().mockImplementation((callback) => callback(transactionManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        {
          provide: getRepositoryToken(EscrowAccount),
          useValue: mockEscrowRepo,
        },
        {
          provide: getRepositoryToken(Milestone),
          useValue: mockMilestoneRepo,
        },
        {
          provide: getRepositoryToken(Offer),
          useValue: mockOfferRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
    escrowRepository = module.get(getRepositoryToken(EscrowAccount));
    milestoneRepository = module.get(getRepositoryToken(Milestone));
    offerRepository = module.get(getRepositoryToken(Offer));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('releaseFunds', () => {
    const releaseFundsDto: ReleaseFundsDto = {
      milestoneId: mockMilestoneId,
      type: ReleaseFundsType.MILESTONE,
      notes: 'Milestone completed',
    };

    it('should release funds successfully', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(mockMilestone);
      transactionManager.save.mockResolvedValue(mockMilestone);

      // Execute
      const result = await service.releaseFunds(releaseFundsDto, mockSellerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Funds released successfully');
      expect(result.data.milestoneId).toBe(mockMilestoneId);
      expect(result.data.amount).toBe(500);
      expect(result.data.status).toBe(MilestoneStatus.RELEASED);
      expect(result.data.totalReleased).toBe(500);

      expect(transactionManager.findOne).toHaveBeenCalledWith(Milestone, {
        where: { id: mockMilestoneId },
        relations: ['escrowAccount', 'escrowAccount.offer', 'escrowAccount.buyer', 'escrowAccount.seller'],
      });
      expect(transactionManager.save).toHaveBeenCalledTimes(2); // milestone and escrow
    });

    it('should throw NotFoundException when milestone not found', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.releaseFunds(releaseFundsDto, mockSellerId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the seller', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(mockMilestone);

      // Execute & Assert
      await expect(service.releaseFunds(releaseFundsDto, mockBuyerId))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when milestone is not approved', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(mockUnapprovedMilestone);

      // Execute & Assert
      await expect(service.releaseFunds(releaseFundsDto, mockSellerId))
        .rejects.toThrow(BadRequestException);
      
      expect(transactionManager.findOne).toHaveBeenCalledWith(Milestone, {
        where: { id: mockMilestoneId },
        relations: ['escrowAccount', 'escrowAccount.offer', 'escrowAccount.buyer', 'escrowAccount.seller'],
      });
    });

    it('should throw BadRequestException when funds already released (double release)', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(mockReleasedMilestone);

      // Execute & Assert
      await expect(service.releaseFunds(releaseFundsDto, mockSellerId))
        .rejects.toThrow(BadRequestException);
      
      expect(transactionManager.findOne).toHaveBeenCalledWith(Milestone, {
        where: { id: mockMilestoneId },
        relations: ['escrowAccount', 'escrowAccount.offer', 'escrowAccount.buyer', 'escrowAccount.seller'],
      });
    });

    it('should update escrow status to RELEASED when all funds are released', async () => {
      // Setup - milestone amount equals total amount
      const fullAmountMilestone = {
        ...mockMilestone,
        amount: 1000,
      };
      const expectedEscrow = {
        ...mockEscrowAccount,
        status: EscrowStatus.RELEASED,
        releasedAmount: 1000,
      };
      
      transactionManager.findOne.mockResolvedValue(fullAmountMilestone);
      transactionManager.save.mockResolvedValue(expectedEscrow);

      // Execute
      const result = await service.releaseFunds(releaseFundsDto, mockSellerId);

      // Assert
      expect(result.data.escrowStatus).toBe(EscrowStatus.RELEASED);
      expect(result.data.totalReleased).toBe(1000);
    });
  });

  describe('approveMilestone', () => {
    const approveMilestoneDto: ApproveMilestoneDto = {
      milestoneId: mockMilestoneId,
      approved: true,
      notes: 'Work looks good',
    };

    it('should approve milestone successfully', async () => {
      // Setup
      const pendingMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.PENDING,
        buyerApproved: false,
        approvedAt: null,
      };
      
      transactionManager.findOne.mockResolvedValue(pendingMilestone);
      transactionManager.save.mockResolvedValue({
        ...pendingMilestone,
        status: MilestoneStatus.APPROVED,
        buyerApproved: true,
        approvedAt: new Date(),
      });

      // Execute
      const result = await service.approveMilestone(approveMilestoneDto, mockBuyerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Milestone approved successfully');
      expect(transactionManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerApproved: true,
          status: MilestoneStatus.APPROVED,
        })
      );
    });

    it('should reject milestone successfully', async () => {
      // Setup
      const rejectDto = { ...approveMilestoneDto, approved: false };
      const pendingMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.PENDING,
        buyerApproved: false,
        approvedAt: null,
      };
      
      transactionManager.findOne.mockResolvedValue(pendingMilestone);
      transactionManager.save.mockResolvedValue({
        ...pendingMilestone,
        status: MilestoneStatus.REJECTED,
        buyerApproved: false,
        approvedAt: new Date(),
      });

      // Execute
      const result = await service.approveMilestone(rejectDto, mockBuyerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Milestone rejected');
    });

    it('should throw NotFoundException when milestone not found', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.approveMilestone(approveMilestoneDto, mockBuyerId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the buyer', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(mockMilestone);

      // Execute & Assert
      await expect(service.approveMilestone(approveMilestoneDto, mockSellerId))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when milestone is not pending', async () => {
      // Setup
      const approvedMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.APPROVED,
      };
      transactionManager.findOne.mockResolvedValue(approvedMilestone);

      // Execute & Assert
      await expect(service.approveMilestone(approveMilestoneDto, mockBuyerId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getEscrowByOfferId', () => {
    it('should return escrow account for authorized user', async () => {
      // Setup
      escrowRepository.findOne.mockResolvedValue({
        ...mockEscrowAccount,
        milestones: [mockMilestone],
      } as any);

      // Execute
      const result = await service.getEscrowByOfferId(mockOfferId, mockSellerId);

      // Assert
      expect(result.id).toBe(mockEscrowId);
      expect(result.offerId).toBe(mockOfferId);
      expect(result.milestones).toHaveLength(1);
    });

    it('should throw NotFoundException when escrow not found', async () => {
      // Setup
      escrowRepository.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.getEscrowByOfferId(mockOfferId, mockSellerId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized', async () => {
      // Setup
      escrowRepository.findOne.mockResolvedValue(mockEscrowAccount as any);
      const unauthorizedUserId = 999;

      // Execute & Assert
      await expect(service.getEscrowByOfferId(mockOfferId, unauthorizedUserId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('createEscrowAccount', () => {
    const milestoneData = [
      { title: 'Phase 1', description: 'Initial setup', amount: 500 },
      { title: 'Phase 2', description: 'Development', amount: 500 },
    ];

    it('should create escrow account with milestones', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(null); // No existing escrow
      transactionManager.create.mockImplementation((entity, data) => ({ ...data }));
      transactionManager.save.mockImplementation((entity) => Promise.resolve(entity));

      const mockEscrowWithMilestones = {
        ...mockEscrowAccount,
        milestones: milestoneData.map((m, index) => ({
          id: `milestone-${index}`,
          ...m,
          escrowAccountId: mockEscrowId,
          status: MilestoneStatus.PENDING,
          buyerApproved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      };

      transactionManager.save.mockResolvedValueOnce(mockEscrowAccount);
      transactionManager.save.mockResolvedValueOnce(mockEscrowWithMilestones.milestones);

      // Execute
      const result = await service.createEscrowAccount(
        mockOfferId,
        mockBuyerId,
        mockSellerId,
        1000,
        milestoneData,
      );

      // Assert
      expect(result.id).toBe(mockEscrowId);
      expect(result.totalAmount).toBe(1000);
      expect(transactionManager.create).toHaveBeenCalledTimes(3); // 1 escrow + 2 milestones
      expect(transactionManager.save).toHaveBeenCalledTimes(2); // escrow and milestones
    });

    it('should throw BadRequestException when escrow already exists', async () => {
      // Setup
      transactionManager.findOne.mockResolvedValue(mockEscrowAccount);

      // Execute & Assert
      await expect(service.createEscrowAccount(
        mockOfferId,
        mockBuyerId,
        mockSellerId,
        1000,
        milestoneData,
      )).rejects.toThrow(BadRequestException);
    });
  });
});
