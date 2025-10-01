import { IsOptional, IsString } from 'class-validator';

export class ApproveMilestoneDto {
  @IsOptional()
  @IsString()
  type?: string; // placeholder if future variations required
}
