import { Injectable } from '@nestjs/common';
import { EscrowService } from '../escrow/services/escrow.service';

/**
 * Example integration between Offers and Escrow modules
 * This shows how the escrow system would be integrated when offers are accepted
 */
@Injectable()
export class OffersEscrowIntegrationService {
  constructor(private readonly escrowService: EscrowService) {}

  /**
   * Create escrow account when an offer is accepted
   * This would be called from the existing OffersService.accept() method
   */
  async createEscrowForAcceptedOffer(
    offerId: string,
    buyerId: number,
    sellerId: number,
    offerAmount: number,
  ): Promise<void> {
    // Example milestone structure - in real implementation, 
    // this could be configurable or based on offer details
    const defaultMilestones = [
      {
        title: 'Project Start',
        description: 'Initial work and planning phase',
        amount: offerAmount * 0.3, // 30% upfront
      },
      {
        title: 'Midpoint Review',
        description: 'Mid-project milestone and review',
        amount: offerAmount * 0.4, // 40% at midpoint
      },
      {
        title: 'Project Completion',
        description: 'Final delivery and completion',
        amount: offerAmount * 0.3, // 30% on completion
      },
    ];

    try {
      await this.escrowService.createEscrowAccount(
        offerId,
        buyerId,
        sellerId,
        offerAmount,
        defaultMilestones,
      );

      console.log(`Escrow account created for offer ${offerId} with ${defaultMilestones.length} milestones`);
    } catch (error) {
      console.error('Failed to create escrow account:', error);
      // In real implementation, you might want to roll back the offer acceptance
      throw error;
    }
  }

  /**
   * Example of how to use the releaseFunds functionality
   * This could be called from a frontend or API endpoint
   */
  async handleMilestoneCompletion(
    milestoneId: string,
    sellerId: number,
    notes?: string,
  ): Promise<any> {
    try {
      const result = await this.escrowService.releaseFunds(
        {
          milestoneId,
          type: 'milestone' as any,
          notes,
        },
        sellerId,
      );

      return result;
    } catch (error) {
      console.error('Failed to release funds:', error);
      throw error;
    }
  }

  /**
   * Example workflow for milestone approval and fund release
   */
  async completeMilestoneWorkflow(
    milestoneId: string,
    buyerId: number,
    sellerId: number,
    buyerApproval: boolean,
    buyerNotes?: string,
    sellerNotes?: string,
  ): Promise<{ approved: boolean; released?: boolean; data?: any }> {
    try {
      // Step 1: Buyer approves/rejects milestone
      await this.escrowService.approveMilestone(
        {
          milestoneId,
          approved: buyerApproval,
          notes: buyerNotes,
        },
        buyerId,
      );

      if (!buyerApproval) {
        return { approved: false };
      }

      // Step 2: If approved, seller can release funds
      const releaseResult = await this.escrowService.releaseFunds(
        {
          milestoneId,
          type: 'milestone' as any,
          notes: sellerNotes,
        },
        sellerId,
      );

      return {
        approved: true,
        released: true,
        data: releaseResult,
      };
    } catch (error) {
      console.error('Milestone workflow failed:', error);
      throw error;
    }
  }
}
