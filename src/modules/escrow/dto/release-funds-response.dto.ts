import { ApiProperty } from '@nestjs/swagger';
import { MilestoneStatus } from '../enums/milestone-status.enum';
import { EscrowStatus } from '../enums/escrow-status.enum';

export class ReleaseFundsResponseDto {
  @ApiProperty({
    description: 'Success status of the operation',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Status message',
    example: 'Funds released successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Release operation data',
  })
  data: {
    milestoneId: string;
    amount: number;
    status: MilestoneStatus;
    releasedAt: Date;
    escrowStatus: EscrowStatus;
    totalReleased: number;
  };
}

export class MilestoneDto {
  @ApiProperty({ description: 'Milestone ID' })
  id: string;

  @ApiProperty({ description: 'Milestone title' })
  title: string;

  @ApiProperty({ description: 'Milestone description' })
  description: string;

  @ApiProperty({ description: 'Milestone amount' })
  amount: number;

  @ApiProperty({ description: 'Milestone status', enum: MilestoneStatus })
  status: MilestoneStatus;

  @ApiProperty({ description: 'Whether buyer has approved' })
  buyerApproved: boolean;

  @ApiProperty({ description: 'Approval timestamp' })
  approvedAt: Date | null;

  @ApiProperty({ description: 'Release timestamp' })
  releasedAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class EscrowAccountDto {
  @ApiProperty({ description: 'Escrow account ID' })
  id: string;

  @ApiProperty({ description: 'Associated offer ID' })
  offerId: string;

  @ApiProperty({ description: 'Buyer ID' })
  buyerId: number;

  @ApiProperty({ description: 'Seller ID' })
  sellerId: number;

  @ApiProperty({ description: 'Total escrow amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Total released amount' })
  releasedAmount: number;

  @ApiProperty({ description: 'Escrow status', enum: EscrowStatus })
  status: EscrowStatus;

  @ApiProperty({ description: 'Associated milestones', type: [MilestoneDto] })
  milestones: MilestoneDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
