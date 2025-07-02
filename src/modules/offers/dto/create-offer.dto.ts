import { IsString, IsNumber, IsUUID, IsOptional, Min, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ description: 'ID of the buyer request this offer responds to' })
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

  @ApiPropertyOptional({ description: 'ID of the product being offered (optional)' })
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiProperty({ description: 'Title of the offer', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'Detailed description of the offer' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Price of the offer', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}
