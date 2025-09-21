// dto/escrow.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsEnum,
  Matches,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class InitializeEscrowDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toString())
  amount: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, {
    message: 'Recipient must be a valid Stellar public key',
  })
  recipient: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(Date.now() + 3600000, { // At least 1 hour from now
    message: 'Deadline must be at least 1 hour in the future',
  })
  @Transform(({ value }) => parseInt(value))
  deadline?: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, {
    message: 'Seller public key must be a valid Stellar public key',
  })
  sellerPublicKey: string;

  @IsOptional()
  @IsEnum(['draft', 'deploy'])
  type?: 'draft' | 'deploy' = 'deploy';
}

export class CheckSellerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, {
    message: 'Public key must be a valid Stellar public key',
  })
  publicKey: string;
}

export class ConfirmEscrowDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'Transaction hash must be a valid hex string',
  })
  transactionHash: string;

  @IsString()
  @IsNotEmpty()
  contractId: string;
}

export class EscrowStatusDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;
  
  @IsString()
  @IsNotEmpty()
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  
  @IsString()
  @IsNotEmpty()
  amount: string;
  
  @IsString()
  @IsNotEmpty()
  token: string;
  
  @IsString()
  @IsNotEmpty()
  seller: string;
  
  @IsString()
  @IsNotEmpty()
  recipient: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsNumber()
  deadline?: number;
  
  @IsString()
  @IsNotEmpty()
  createdAt: string;
  
  @IsOptional()
  @IsString()
  transactionHash?: string;
}