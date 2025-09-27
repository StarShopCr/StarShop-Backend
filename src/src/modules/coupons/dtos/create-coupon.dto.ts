import { IsString, IsNumber, IsDate, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  @Max(100)
  value: number;

  @IsNumber()
  @Min(0)
  minPurchaseAmount: number;

  @IsNumber()
  @Min(0)
  maxDiscountAmount: number;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsNumber()
  @Min(1)
  usageLimit: number;

  @IsString()
  created_by: string;
}
