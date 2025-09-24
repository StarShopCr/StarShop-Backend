import { IsUUID, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveMilestoneDto {
  @ApiProperty({
    description: 'ID of the milestone to approve',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Milestone ID must be a valid UUID' })
  milestoneId: string;

  @ApiProperty({
    description: 'Whether to approve or reject the milestone',
    example: true,
  })
  @IsBoolean({ message: 'Approved must be a boolean value' })
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Optional notes for the approval/rejection',
    example: 'Work completed satisfactorily',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
