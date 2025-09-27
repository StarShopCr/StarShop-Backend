import { IsString, IsNumber, Min } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0)
  purchaseAmount: number;
}
