import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsPositive,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: CouponType, description: 'Type of discount' })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Discount value (percentage or fixed amount)' })
  @IsNumber()
  @IsPositive()
  value: number;

  @ApiProperty({ description: 'Minimum purchase amount required' })
  @IsNumber()
  @IsPositive()
  minPurchaseAmount: number;

  @ApiProperty({ description: 'Maximum discount amount' })
  @IsNumber()
  @IsPositive()
  maxDiscountAmount: number;

  @ApiProperty({ description: 'Start date of the coupon' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'End date of the coupon' })
  @IsDateString()
  endDate: Date;

  @ApiProperty({ description: 'Maximum number of uses' })
  @IsNumber()
  @IsPositive()
  usageLimit: number;

  @ApiProperty({ description: 'ID of the user creating the coupon' })
  @IsString()
  @IsNotEmpty()
  created_by: string;
}

export class OrderDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Order total' })
  @IsNumber()
  @IsPositive()
  total: number;
}

export class ApplyCouponDto {
  @ApiProperty({ description: 'Order details' })
  @ValidateNested()
  @Type(() => OrderDto)
  order: OrderDto;

  @ApiProperty({ description: 'ID of the user applying the coupon' })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
