import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReleaseFundsType {
  MILESTONE = 'milestone',
  FULL = 'full',
}

export class ReleaseFundsDto {
  @ApiProperty({
    description: 'ID of the milestone to release funds for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Milestone ID must be a valid UUID' })
  milestoneId: string;

  @ApiProperty({
    description: 'Type of fund release',
    enum: ReleaseFundsType,
    example: ReleaseFundsType.MILESTONE,
  })
  @IsEnum(ReleaseFundsType, { message: 'Type must be either milestone or full' })
  type: ReleaseFundsType;

  @ApiPropertyOptional({
    description: 'Optional notes for the fund release',
    example: 'Milestone completed successfully',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
