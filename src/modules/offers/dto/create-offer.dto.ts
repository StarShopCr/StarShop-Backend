import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Min,
  Max,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class CreateOfferDto {
  @ApiProperty({ description: 'ID of the buyer request this offer responds to' })
  @IsUUID()
  @IsNotEmpty()
  buyerRequestId: string

  @ApiPropertyOptional({ description: 'ID of the product being offered (optional)' })
  @IsOptional()
  @IsNumber()
  productId?: number

  @ApiProperty({ description: 'Title of the offer', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string

  @ApiProperty({ description: 'Detailed description of the offer' })
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty({ description: 'Price of the offer', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => Number.parseFloat(value))
  price: number

  @ApiPropertyOptional({ description: 'Delivery days (optional)', minimum: 1, maximum: 365 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Transform(({ value }) => Number.parseInt(value))
  deliveryDays?: number = 7

  @ApiPropertyOptional({ description: 'Additional notes (optional)' })
  @IsOptional()
  @IsString()
  notes?: string
}
