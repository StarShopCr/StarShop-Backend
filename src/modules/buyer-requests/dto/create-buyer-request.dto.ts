import { IsString, IsNumber, Min, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBuyerRequestDto {
  @ApiProperty({ description: 'Title of the buyer request', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Detailed description of what the buyer is looking for' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Budget for the request', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget: number;
}
