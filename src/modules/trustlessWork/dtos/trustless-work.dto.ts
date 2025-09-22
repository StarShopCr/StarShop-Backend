import { IsString, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested, IsBoolean, Matches, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NetworkType {
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
}

export enum EscrowType {
  SINGLE_RELEASE = 'single-release',
  MULTI_RELEASE = 'multi-release',
}

export class MilestoneDto {
  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Milestone description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Milestone amount' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({ description: 'Milestone due date' })
  @IsOptional()
  @IsString()
  due_date?: string;
}

// DTO específico para la issue - Initialize Escrow
export class InitializeEscrowDto {
  @ApiProperty({ enum: EscrowType, description: 'Type of escrow to deploy' })
  @IsEnum(EscrowType)
  type: EscrowType;

  @ApiProperty({ description: 'Seller (Service provider) Stellar public key' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, { message: 'Invalid Stellar public key format' })
  seller_key: string;

  @ApiProperty({ description: 'Approver Stellar public key' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, { message: 'Invalid Stellar public key format' })
  approver: string;

  @ApiProperty({ description: 'Receiver Stellar public key' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, { message: 'Invalid Stellar public key format' })
  receiver: string;

  @ApiProperty({ description: 'Dispute resolver Stellar public key' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, { message: 'Invalid Stellar public key format' })
  dispute_resolver: string;

  @ApiProperty({ description: 'Total escrow amount' })
  @IsString()
  @IsNotEmpty()
  total_amount?: string; // Solo para single-release

  @ApiProperty({ type: [MilestoneDto], description: 'List of milestones (for multi-release)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[]; // Solo para multi-release

  @ApiProperty({ description: 'Asset code (e.g., USDC, XLM)' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiPropertyOptional({ description: 'Asset issuer (for custom assets)' })
  @IsOptional()
  @IsString()
  asset_issuer?: string;

  @ApiProperty({ description: 'Escrow title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Escrow description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Platform fee percentage' })
  @IsOptional()
  @IsString()
  platform_fee?: string;

  @ApiPropertyOptional({ description: 'Platform fee receiver' })
  @IsOptional()
  @IsString()
  platform_fee_receiver?: string;
}

export class SendSignedTransactionDto {
  @ApiProperty({ enum: NetworkType, description: 'Stellar network' })
  @IsEnum(NetworkType)
  network: NetworkType;

  @ApiProperty({ description: 'Signed XDR transaction' })
  @IsString()
  @IsNotEmpty()
  signed_xdr: string;

  @ApiPropertyOptional({ description: 'Contract ID for tracking' })
  @IsOptional()
  @IsString()
  contract_id?: string;
}



export class DeploySingleReleaseEscrowDto {
  @ApiProperty({ description: 'Service provider Stellar public key' })
  @IsString()
  service_provider: string;

  @ApiProperty({ description: 'Approver Stellar public key' })
  @IsString()
  approver: string;

  @ApiProperty({ description: 'Receiver Stellar public key' })
  @IsString()
  receiver: string;

  @ApiProperty({ description: 'Dispute resolver Stellar public key' })
  @IsString()
  dispute_resolver: string;

  @ApiProperty({ description: 'Total escrow amount' })
  @IsString()
  total_amount: string;

  @ApiProperty({ description: 'Asset code (e.g., USDC, XLM)' })
  @IsString()
  asset: string;

  @ApiPropertyOptional({ description: 'Asset issuer (for custom assets)' })
  @IsOptional()
  @IsString()
  asset_issuer?: string;

  @ApiProperty({ description: 'Escrow title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Escrow description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Platform fee percentage' })
  @IsOptional()
  @IsString()
  platform_fee?: string;

  @ApiPropertyOptional({ description: 'Platform fee receiver' })
  @IsOptional()
  @IsString()
  platform_fee_receiver?: string;
}

export class DeployMultiReleaseEscrowDto {
  @ApiProperty({ description: 'Service provider Stellar public key' })
  @IsString()
  service_provider: string;

  @ApiProperty({ description: 'Approver Stellar public key' })
  @IsString()
  approver: string;

  @ApiProperty({ description: 'Receiver Stellar public key' })
  @IsString()
  receiver: string;

  @ApiProperty({ description: 'Dispute resolver Stellar public key' })
  @IsString()
  dispute_resolver: string;

  @ApiProperty({ type: [MilestoneDto], description: 'List of milestones' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones: MilestoneDto[];

  @ApiProperty({ description: 'Asset code (e.g., USDC, XLM)' })
  @IsString()
  asset: string;

  @ApiPropertyOptional({ description: 'Asset issuer (for custom assets)' })
  @IsOptional()
  @IsString()
  asset_issuer?: string;

  @ApiProperty({ description: 'Escrow title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Escrow description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Platform fee percentage' })
  @IsOptional()
  @IsString()
  platform_fee?: string;

  @ApiPropertyOptional({ description: 'Platform fee receiver' })
  @IsOptional()
  @IsString()
  platform_fee_receiver?: string;
}

export class FundEscrowDto {
  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;

  @ApiProperty({ description: 'Funder Stellar public key' })
  @IsString()
  funder_key: string;

  @ApiProperty({ description: 'Amount to fund' })
  @IsString()
  amount: string;
}

export class GetEscrowDto {
  @ApiProperty({ enum: NetworkType, description: 'Stellar network' })
  @IsEnum(NetworkType)
  network: NetworkType;

  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;
}

export class ApproveMilestoneDto {
  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;

  @ApiProperty({ description: 'Approver Stellar public key' })
  @IsString()
  approver_key: string;

  @ApiProperty({ description: 'Milestone index to approve' })
  @IsNumber()
  milestone_index: number;
}

export class ReleaseFundsDto {
  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;

  @ApiProperty({ description: 'Releaser Stellar public key' })
  @IsString()
  releaser_key: string;
}

export class ReleaseMilestoneFundsDto {
  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;

  @ApiProperty({ description: 'Releaser Stellar public key' })
  @IsString()
  releaser_key: string;

  @ApiProperty({ description: 'Milestone index to release' })
  @IsNumber()
  milestone_index: number;
}

export class DisputeEscrowDto {
  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;

  @ApiProperty({ description: 'Disputer Stellar public key' })
  @IsString()
  disputer_key: string;

  @ApiProperty({ description: 'Dispute reason' })
  @IsString()
  reason: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;

  @ApiProperty({ description: 'Dispute resolver Stellar public key' })
  @IsString()
  resolver_key: string;

  @ApiProperty({ description: 'Resolution decision' })
  @IsBoolean()
  approve_release: boolean;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolution_notes?: string;
}

export class UpdateEscrowDto {
  @ApiProperty({ description: 'Contract ID of the escrow' })
  @IsString()
  contract_id: string;

  @ApiProperty({ description: 'Updater Stellar public key' })
  @IsString()
  updater_key: string;

  @ApiPropertyOptional({ description: 'New title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'New description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SetTrustlineDto {
  @ApiProperty({ description: 'Account Stellar public key' })
  @IsString()
  account_key: string;

  @ApiProperty({ description: 'Asset code' })
  @IsString()
  asset: string;

  @ApiProperty({ description: 'Asset issuer' })
  @IsString()
  asset_issuer: string;

  @ApiPropertyOptional({ description: 'Trust limit' })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class SendTransactionDto {
  @ApiProperty({ description: 'Signed XDR transaction' })
  @IsString()
  signed_xdr: string;
}

export class GetEscrowsBySignerDto {
  @ApiProperty({ enum: NetworkType, description: 'Stellar network' })
  @IsEnum(NetworkType)
  network: NetworkType;

  @ApiProperty({ description: 'Signer Stellar public key' })
  @IsString()
  signer: string;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class GetEscrowsByRoleDto {
  @ApiProperty({ enum: NetworkType, description: 'Stellar network' })
  @IsEnum(NetworkType)
  network: NetworkType;

  @ApiProperty({ description: 'User Stellar public key' })
  @IsString()
  user_key: string;

  @ApiProperty({ description: 'Role to filter by' })
  @IsString()
  role: string;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}