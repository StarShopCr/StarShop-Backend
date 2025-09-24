import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EscrowAccount } from '../entities/escrow-account.entity';
import { Milestone } from '../entities/milestone.entity';
import { ReleaseFundsDto, ReleaseFundsType } from '../dto/release-funds.dto';
import { ApproveMilestoneDto } from '../dto/approve-milestone.dto';
import { ReleaseFundsResponseDto, EscrowAccountDto, MilestoneDto } from '../dto/release-funds-response.dto';
import { EscrowStatus } from '../enums/escrow-status.enum';
import { MilestoneStatus } from '../enums/milestone-status.enum';
import { Offer } from '../../offers/entities/offer.entity';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(EscrowAccount)
    private escrowRepository: Repository<EscrowAccount>,

    @InjectRepository(Milestone)
    private milestoneRepository: Repository<Milestone>,

    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,

    private dataSource: DataSource,
  ) {}

  /**
   * Release funds for a specific milestone after buyer approval
   */
  async releaseFunds(
    releaseFundsDto: ReleaseFundsDto,
    userId: number,
  ): Promise<ReleaseFundsResponseDto> {
    const { milestoneId, type, notes } = releaseFundsDto;

    return this.dataSource.transaction(async (manager) => {
      // Find the milestone with escrow account and offer details
      const milestone = await manager.findOne(Milestone, {
        where: { id: milestoneId },
        relations: ['escrowAccount', 'escrowAccount.offer', 'escrowAccount.buyer', 'escrowAccount.seller'],
      });

      if (!milestone) {
        throw new NotFoundException('Milestone not found');
      }

      const escrowAccount = milestone.escrowAccount;

      // Authorization check - only seller can release funds
      if (escrowAccount.sellerId !== userId) {
        throw new ForbiddenException('Only the seller can release funds for this milestone');
      }

      // Validate milestone can be released
      await this.validateMilestoneForRelease(milestone);

      // Prevent double release
      if (milestone.status === MilestoneStatus.RELEASED) {
        throw new BadRequestException('Funds for this milestone have already been released');
      }

      // Update milestone status
      milestone.status = MilestoneStatus.RELEASED;
      milestone.releasedAt = new Date();
      await manager.save(milestone);

      // Update escrow account
      const newReleasedAmount = Number(escrowAccount.releasedAmount) + Number(milestone.amount);
      escrowAccount.releasedAmount = newReleasedAmount;

      // Check if all funds are released
      if (newReleasedAmount >= Number(escrowAccount.totalAmount)) {
        escrowAccount.status = EscrowStatus.RELEASED;
      }

      await manager.save(escrowAccount);

      // Log the fund release (in a real application, you'd integrate with payment processor)
      console.log(`Funds released: ${milestone.amount} to seller ${escrowAccount.sellerId} for milestone ${milestoneId}`);

      return {
        success: true,
        message: 'Funds released successfully',
        data: {
          milestoneId: milestone.id,
          amount: Number(milestone.amount),
          status: milestone.status,
          releasedAt: milestone.releasedAt,
          escrowStatus: escrowAccount.status,
          totalReleased: newReleasedAmount,
        },
      };
    });
  }

  /**
   * Approve a milestone (buyer action)
   */
  async approveMilestone(
    approveMilestoneDto: ApproveMilestoneDto,
    userId: number,
  ): Promise<{ success: boolean; message: string; milestone: MilestoneDto }> {
    const { milestoneId, approved, notes } = approveMilestoneDto;

    return this.dataSource.transaction(async (manager) => {
      const milestone = await manager.findOne(Milestone, {
        where: { id: milestoneId },
        relations: ['escrowAccount', 'escrowAccount.buyer'],
      });

      if (!milestone) {
        throw new NotFoundException('Milestone not found');
      }

      // Authorization check - only buyer can approve
      if (milestone.escrowAccount.buyerId !== userId) {
        throw new ForbiddenException('Only the buyer can approve this milestone');
      }

      // Validate milestone state
      if (milestone.status !== MilestoneStatus.PENDING) {
        throw new BadRequestException(`Cannot approve milestone with status: ${milestone.status}`);
      }

      // Update milestone
      milestone.buyerApproved = approved;
      milestone.status = approved ? MilestoneStatus.APPROVED : MilestoneStatus.REJECTED;
      milestone.approvedAt = new Date();

      await manager.save(milestone);

      return {
        success: true,
        message: approved ? 'Milestone approved successfully' : 'Milestone rejected',
        milestone: this.mapMilestoneToDto(milestone),
      };
    });
  }

  /**
   * Get escrow account by offer ID
   */
  async getEscrowByOfferId(offerId: string, userId: number): Promise<EscrowAccountDto> {
    const escrowAccount = await this.escrowRepository.findOne({
      where: { offerId },
      relations: ['milestones', 'buyer', 'seller', 'offer'],
    });

    if (!escrowAccount) {
      throw new NotFoundException('Escrow account not found for this offer');
    }

    // Authorization check - only buyer or seller can view
    if (escrowAccount.buyerId !== userId && escrowAccount.sellerId !== userId) {
      throw new ForbiddenException('You are not authorized to view this escrow account');
    }

    return this.mapEscrowAccountToDto(escrowAccount);
  }

  /**
   * Get milestone by ID
   */
  async getMilestoneById(milestoneId: string, userId: number): Promise<MilestoneDto> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId },
      relations: ['escrowAccount'],
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Authorization check
    if (milestone.escrowAccount.buyerId !== userId && milestone.escrowAccount.sellerId !== userId) {
      throw new ForbiddenException('You are not authorized to view this milestone');
    }

    return this.mapMilestoneToDto(milestone);
  }

  /**
   * Create escrow account for accepted offer
   */
  async createEscrowAccount(
    offerId: string,
    buyerId: number,
    sellerId: number,
    totalAmount: number,
    milestones: Array<{ title: string; description?: string; amount: number }>,
  ): Promise<EscrowAccountDto> {
    return this.dataSource.transaction(async (manager) => {
      // Check if escrow already exists
      const existingEscrow = await manager.findOne(EscrowAccount, {
        where: { offerId },
      });

      if (existingEscrow) {
        throw new BadRequestException('Escrow account already exists for this offer');
      }

      // Create escrow account
      const escrowAccount = manager.create(EscrowAccount, {
        offerId,
        buyerId,
        sellerId,
        totalAmount,
        status: EscrowStatus.PENDING,
      });

      const savedEscrow = await manager.save(escrowAccount);

      // Create milestones
      const milestoneEntities = milestones.map((milestone) =>
        manager.create(Milestone, {
          escrowAccountId: savedEscrow.id,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          status: MilestoneStatus.PENDING,
        }),
      );

      savedEscrow.milestones = await manager.save(milestoneEntities);

      return this.mapEscrowAccountToDto(savedEscrow);
    });
  }

  /**
   * Validate milestone can be released
   */
  private async validateMilestoneForRelease(milestone: Milestone): Promise<void> {
    // Rule: Buyer must approve before release
    if (!milestone.buyerApproved) {
      throw new BadRequestException('Milestone must be approved by buyer before funds can be released');
    }

    if (milestone.status !== MilestoneStatus.APPROVED) {
      throw new BadRequestException('Only approved milestones can have funds released');
    }

    // Ensure escrow is in correct state
    if (milestone.escrowAccount.status === EscrowStatus.RELEASED) {
      throw new BadRequestException('All funds from this escrow have already been released');
    }

    if (milestone.escrowAccount.status === EscrowStatus.REFUNDED) {
      throw new BadRequestException('Cannot release funds from a refunded escrow');
    }

    if (milestone.escrowAccount.status === EscrowStatus.DISPUTED) {
      throw new BadRequestException('Cannot release funds from a disputed escrow');
    }
  }

  /**
   * Map EscrowAccount entity to DTO
   */
  private mapEscrowAccountToDto(escrowAccount: EscrowAccount): EscrowAccountDto {
    return {
      id: escrowAccount.id,
      offerId: escrowAccount.offerId,
      buyerId: escrowAccount.buyerId,
      sellerId: escrowAccount.sellerId,
      totalAmount: Number(escrowAccount.totalAmount),
      releasedAmount: Number(escrowAccount.releasedAmount),
      status: escrowAccount.status,
      milestones: escrowAccount.milestones?.map(this.mapMilestoneToDto) || [],
      createdAt: escrowAccount.createdAt,
      updatedAt: escrowAccount.updatedAt,
    };
  }

  /**
   * Map Milestone entity to DTO
   */
  private mapMilestoneToDto(milestone: Milestone): MilestoneDto {
    return {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      amount: Number(milestone.amount),
      status: milestone.status,
      buyerApproved: milestone.buyerApproved,
      approvedAt: milestone.approvedAt,
      releasedAt: milestone.releasedAt,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    };
  }
}
