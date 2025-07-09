import { IsBoolean, IsOptional } from 'class-validator';

export class BlockBuyerRequestDto {
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean;
}
