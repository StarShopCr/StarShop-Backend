import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBuyerRequestDto {
  @ApiProperty({ description: 'Title of the buyer request', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @ApiProperty({ description: 'Detailed description of what the buyer is looking for', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Minimum budget', minimum: 0, example: 100 })
  @IsNumber({}, { message: 'Budget minimum must be a valid number' })
  @Min(0, { message: 'Budget minimum must be at least 0' })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMin: number;

  @ApiProperty({ description: 'Maximum budget', minimum: 0, example: 1000 })
  @IsNumber({}, { message: 'Budget maximum must be a valid number' })
  @Min(0, { message: 'Budget maximum must be at least 0' })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMax: number;

  @ApiProperty({ description: 'Category ID', example: 5 })
  @IsNumber({}, { message: 'Category ID must be a valid number' })
  @Transform(({ value }) => Number.parseInt(value))
  categoryId: number;

  @ApiProperty({ description: 'Expiration date for this request', required: false, example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Expires at must be a valid date' })
  expiresAt?: string;
}
