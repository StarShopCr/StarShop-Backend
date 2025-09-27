import { IsOptional, IsIn } from 'class-validator';

export class GetEscrowsQueryDto {
  @IsOptional()
  @IsIn(['buyer', 'seller'])
  role?: 'buyer' | 'seller';
}
