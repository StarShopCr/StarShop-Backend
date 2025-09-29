import { IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FundEscrowDto {
  @ApiProperty({ example: 'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE' })
  @IsString()
  signer: string;

  @ApiProperty({ example: '100.5', description: 'Amount to fund in asset units (stringifiable number)' })
  @IsNumber({}, { message: 'amount must be a number' })
  @IsPositive()
  amount: number;
}
