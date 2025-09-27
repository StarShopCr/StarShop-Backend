import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from './create-coupon.dto';

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
