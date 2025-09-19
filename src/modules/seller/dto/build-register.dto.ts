import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class BuildRegisterDto {
  @ApiProperty({
    description: 'Stellar payout wallet address for the seller',
    example: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'Invalid Stellar wallet address format',
  })
  payoutWallet: string;
}

export class BuildRegisterResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Unsigned XDR transaction for Soroban contract registration',
    example: 'AAAAAgAAAABqjgAAAAAA...',
  })
  data: {
    unsignedXdr: string;
    contractAddress: string;
  };
}
