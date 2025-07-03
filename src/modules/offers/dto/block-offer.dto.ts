import { IsBoolean, IsOptional } from 'class-validator';

export class BlockOfferDto {
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean;
}
