import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEthereumAddress,
  Min,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEscrowDto {
  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsEthereumAddress()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  deadline?: number;
}

export class EscrowParamsDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class EscrowResponseDto {
  id: string;
  status: string;
  amount: string;
  token: string;
  creator: string;
  recipient: string;
  description?: string;
  createdAt: string;
  deadline?: number;
  transactionHash?: string;
}

export class OperationResultDto {
  success: boolean;
  transactionHash?: string;
  message?: string;
  timestamp: string;
}

export class HealthCheckResponseDto {
  status: string;
  timestamp: string;
  environment: string;
}

export class ConfigResponseDto {
  baseURL: string;
  environment: string;
  // Note: We don't expose the API key for security reasons
}