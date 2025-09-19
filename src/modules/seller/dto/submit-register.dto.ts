import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitRegisterDto {
  @ApiProperty({
    description: 'Signed XDR transaction for Soroban contract registration',
    example: 'AAAAAgAAAABqjgAAAAAA...',
  })
  @IsString()
  @IsNotEmpty()
  signedXdr: string;
}

export class SubmitRegisterResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Registration result with transaction hash',
  })
  data: {
    transactionHash: string;
    contractId: string;
    payoutWallet: string;
    registered: boolean;
  };
}
