import { Test, TestingModule } from '@nestjs/testing';
import { EscrowController } from '../controllers/escrow.controller';
import { EscrowService } from '../services/escrow.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ReleaseFundsDto, ReleaseFundsType } from '../dto/release-funds.dto';
import { ApproveMilestoneDto } from '../dto/approve-milestone.dto';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { MilestoneStatus } from '../enums/milestone-status.enum';
import { EscrowStatus } from '../enums/escrow-status.enum';

describe('EscrowController', () => {
  let controller: EscrowController;
  let escrowService: jest.Mocked<EscrowService>;

  const mockUser = {
    id: 1,
    walletAddress: 'GABCD...',
    role: ['seller'],
    email: 'seller@test.com',
  };

  const mockRequest = {
    user: mockUser,
  } as AuthenticatedRequest;

  const mockReleaseFundsResponse = {
    success: true,
    message: 'Funds released successfully',
    data: {
      milestoneId: 'milestone-123',
      amount: 500,
      status: MilestoneStatus.RELEASED,
      releasedAt: new Date(),
      escrowStatus: EscrowStatus.FUNDED,
      totalReleased: 500,
    },
  };

  beforeEach(async () => {
    const mockEscrowService = {
      releaseFunds: jest.fn(),
      approveMilestone: jest.fn(),
      getEscrowByOfferId: jest.fn(),
      getMilestoneById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscrowController],
      providers: [
        {
          provide: EscrowService,
          useValue: mockEscrowService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<EscrowController>(EscrowController);
    escrowService = module.get(EscrowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('releaseFunds', () => {
    const releaseFundsDto: ReleaseFundsDto = {
      milestoneId: 'milestone-123',
      type: ReleaseFundsType.MILESTONE,
      notes: 'Work completed',
    };

    it('should release funds successfully', async () => {
      // Setup
      escrowService.releaseFunds.mockResolvedValue(mockReleaseFundsResponse);

      // Execute
      const result = await controller.releaseFunds(releaseFundsDto, mockRequest);

      // Assert
      expect(result).toEqual(mockReleaseFundsResponse);
      expect(escrowService.releaseFunds).toHaveBeenCalledWith(releaseFundsDto, 1);
    });

    it('should handle service errors', async () => {
      // Setup
      const error = new Error('Service error');
      escrowService.releaseFunds.mockRejectedValue(error);

      // Execute & Assert
      await expect(controller.releaseFunds(releaseFundsDto, mockRequest))
        .rejects.toThrow('Service error');
    });
  });

  describe('approveMilestone', () => {
    const approveMilestoneDto: ApproveMilestoneDto = {
      milestoneId: 'milestone-123',
      approved: true,
      notes: 'Looks good',
    };

    const mockApprovalResponse = {
      success: true,
      message: 'Milestone approved successfully',
      milestone: {
        id: 'milestone-123',
        title: 'Phase 1',
        description: 'Initial work',
        amount: 500,
        status: MilestoneStatus.APPROVED,
        buyerApproved: true,
        approvedAt: new Date(),
        releasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should approve milestone successfully', async () => {
      // Setup
      escrowService.approveMilestone.mockResolvedValue(mockApprovalResponse);

      // Execute
      const result = await controller.approveMilestone(approveMilestoneDto, mockRequest);

      // Assert
      expect(result).toEqual(mockApprovalResponse);
      expect(escrowService.approveMilestone).toHaveBeenCalledWith(approveMilestoneDto, 1);
    });
  });

  describe('getEscrowByOfferId', () => {
    const offerId = 'offer-123';
    const mockEscrowResponse = {
      id: 'escrow-123',
      offerId,
      buyerId: 1,
      sellerId: 2,
      totalAmount: 1000,
      releasedAmount: 0,
      status: EscrowStatus.FUNDED,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get escrow account by offer ID', async () => {
      // Setup
      escrowService.getEscrowByOfferId.mockResolvedValue(mockEscrowResponse);

      // Execute
      const result = await controller.getEscrowByOfferId(offerId, mockRequest);

      // Assert
      expect(result).toEqual(mockEscrowResponse);
      expect(escrowService.getEscrowByOfferId).toHaveBeenCalledWith(offerId, 1);
    });
  });

  describe('getMilestoneById', () => {
    const milestoneId = 'milestone-123';
    const mockMilestoneResponse = {
      id: milestoneId,
      title: 'Phase 1',
      description: 'Initial work',
      amount: 500,
      status: MilestoneStatus.PENDING,
      buyerApproved: false,
      approvedAt: null,
      releasedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get milestone by ID', async () => {
      // Setup
      escrowService.getMilestoneById.mockResolvedValue(mockMilestoneResponse);

      // Execute
      const result = await controller.getMilestoneById(milestoneId, mockRequest);

      // Assert
      expect(result).toEqual(mockMilestoneResponse);
      expect(escrowService.getMilestoneById).toHaveBeenCalledWith(milestoneId, 1);
    });
  });
});
