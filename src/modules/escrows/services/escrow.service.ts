import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Escrow, EscrowStatus } from '../entities/escrow.entity';
import { Milestone, MilestoneStatus } from '../entities/milestone.entity';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Escrow) private readonly escrowRepo: Repository<Escrow>,
    @InjectRepository(Milestone) private readonly milestoneRepo: Repository<Milestone>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Get escrows for a given signer (user) regardless of role (buyer or seller).
   * Includes calculated remaining + released amounts derived from milestones.
   */
  async getEscrowsBySigner(userId: number): Promise<(Escrow & { releasedAmount: number; remainingAmount: number })[]> {
    const escrows = await this.escrowRepo.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: ['milestones'],
      order: { createdAt: 'DESC' },
    });
    return escrows.map((e) => this.withComputedAmounts(e));
  }

  /**
   * Get escrows by role (buyer | seller) for a given user id.
   */
  async getEscrowsByRole(userId: number, role: 'buyer' | 'seller'): Promise<(Escrow & { releasedAmount: number; remainingAmount: number })[]> {
    const where = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    const escrows = await this.escrowRepo.find({ where, relations: ['milestones'], order: { createdAt: 'DESC' } });
    return escrows.map((e) => this.withComputedAmounts(e));
  }

  /**
   * Get balances for multiple escrow ids (used for polling). Returns map keyed by escrow id.
   */
  async getMultipleEscrowBalances(ids: string[]): Promise<Record<string, { releasedAmount: number; remainingAmount: number; status: EscrowStatus }>> {
    if (!ids.length) return {};
    const escrows = await this.escrowRepo.find({ where: ids.map((id) => ({ id })), relations: ['milestones'] });
    return escrows.reduce((acc, e) => {
      const computed = this.computeAmounts(e);
      acc[e.id] = { ...computed, status: e.status };
      return acc;
    }, {} as Record<string, { releasedAmount: number; remainingAmount: number; status: EscrowStatus }>);
  }

  private computeAmounts(escrow: Escrow) {
    const total = Number(escrow.totalAmount) || 0;
    const released = (escrow.milestones || [])
      .filter((m) => m.status === MilestoneStatus.APPROVED)
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const remaining = Math.max(total - released, 0);
    return { releasedAmount: released, remainingAmount: remaining };
  }

  private withComputedAmounts(escrow: Escrow): Escrow & { releasedAmount: number; remainingAmount: number } {
    return Object.assign(escrow, this.computeAmounts(escrow));
  }

  async approveMilestone(escrowId: string, milestoneId: string, userId: number): Promise<Milestone> {
    return this.dataSource.transaction(async (manager) => {
      const milestone = await manager.findOne(Milestone, { where: { id: milestoneId }, relations: ['escrow'] });
      if (!milestone) throw new NotFoundException('Milestone not found');
      if (milestone.escrowId !== escrowId) throw new BadRequestException('Milestone does not belong to escrow');

      const escrow = await manager.findOne(Escrow, { where: { id: escrowId } });
      if (!escrow) throw new NotFoundException('Escrow not found');

      if (escrow.buyerId !== userId) {
        throw new ForbiddenException('Only the buyer can approve milestones');
      }

      if (milestone.status === MilestoneStatus.APPROVED) {
        throw new BadRequestException('Milestone already approved');
      }

      milestone.status = MilestoneStatus.APPROVED;
      milestone.approvedAt = new Date();
      await manager.save(milestone);

      // Update escrow status based on milestones
      const milestones = await manager.find(Milestone, { where: { escrowId } });
      const approvedCount = milestones.filter((m) => m.status === MilestoneStatus.APPROVED).length;
      if (approvedCount === milestones.length) {
        escrow.status = EscrowStatus.COMPLETED;
      } else if (approvedCount > 0) {
        escrow.status = EscrowStatus.IN_PROGRESS;
      }
      await manager.save(escrow);

      return milestone;
    });
  }

  /**
   * Seller changes milestone execution status (ready -> in_progress -> delivered).
   * Constraints:
   * - Only seller of escrow can change
   * - Cannot change if milestone already approved by buyer
   * - Only allowed transitions among READY, IN_PROGRESS, DELIVERED (no skipping backwards)
   */
  async changeMilestoneStatus(
    escrowId: string,
    milestoneId: string,
    sellerId: number,
    nextStatus: MilestoneStatus
  ): Promise<Milestone> {
    const allowed: MilestoneStatus[] = [
      MilestoneStatus.READY,
      MilestoneStatus.IN_PROGRESS,
      MilestoneStatus.DELIVERED,
    ];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException('Status not changeable by seller');
    }

    return this.dataSource.transaction(async (manager) => {
      const milestone = await manager.findOne(Milestone, { where: { id: milestoneId }, relations: ['escrow'] });
      if (!milestone) throw new NotFoundException('Milestone not found');
      if (milestone.escrowId !== escrowId) throw new BadRequestException('Milestone does not belong to escrow');
      const escrow = await manager.findOne(Escrow, { where: { id: escrowId } });
      if (!escrow) throw new NotFoundException('Escrow not found');
      if (escrow.sellerId !== sellerId) throw new ForbiddenException('Only the seller can change milestone status');
      if (milestone.status === MilestoneStatus.APPROVED) throw new BadRequestException('Milestone already approved');

      // Prevent status regression (simple linear order) and disallow skipping forward beyond delivered
      const order: Record<MilestoneStatus, number> = {
        [MilestoneStatus.PENDING]: 0,
        [MilestoneStatus.READY]: 1,
        [MilestoneStatus.IN_PROGRESS]: 2,
        [MilestoneStatus.DELIVERED]: 3,
        [MilestoneStatus.APPROVED]: 4,
      } as any;
      const currentOrder = order[milestone.status];
      const nextOrder = order[nextStatus];
      if (nextOrder < currentOrder) {
        throw new BadRequestException('Cannot move milestone status backwards');
      }
      if (currentOrder === nextOrder) {
        return milestone; // idempotent
      }

      milestone.status = nextStatus;
      await manager.save(milestone);
      return milestone;
    });
  }
}
