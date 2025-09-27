import { IsNumberString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetOffersQueryDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  requestId: string;
}