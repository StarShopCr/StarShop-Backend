import { IsEnum } from 'class-validator';
import { MilestoneStatus } from '../entities/milestone.entity';

// Seller-changeable statuses (not including APPROVED which is buyer action)
export class UpdateMilestoneStatusDto {
  @IsEnum(MilestoneStatus, { message: 'Invalid milestone status' })
  status: MilestoneStatus; // Expect READY | IN_PROGRESS | DELIVERED
}
