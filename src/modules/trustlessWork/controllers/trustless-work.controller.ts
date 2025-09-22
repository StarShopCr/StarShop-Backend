import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TrustlessWorkService } from '../services/trustless-work.service';
import {
  InitializeEscrowDto,
  SendSignedTransactionDto,
  GetEscrowsBySignerDto,
  DeploySingleReleaseEscrowDto,
  DeployMultiReleaseEscrowDto,
  FundEscrowDto,
  GetEscrowDto,
  ApproveMilestoneDto,
  ReleaseFundsDto,
  ReleaseMilestoneFundsDto,
  DisputeEscrowDto,
  ResolveDisputeDto,
  UpdateEscrowDto,
  SetTrustlineDto,
  SendTransactionDto,
  GetEscrowsByRoleDto,
  EscrowType,
} from '../dtos/trustless-work.dto';

@ApiTags('Trustless Work')
@Controller('trustless-work')
export class TrustlessWorkController {
  constructor(private readonly trustlessWorkService: TrustlessWorkService) {}

  // =====================
  // MAIN ENDPOINTS PARA ISSUE #3
  // =====================

  @Post('initialize-escrow')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initialize a new escrow contract (Issue #3)',
    description: 'Creates a new escrow contract and returns unsigned XDR for signing',
  })
  @ApiResponse({
    status: 201,
    description: 'Escrow initialized successfully, returns contractId and unsigned XDR',
    schema: {
      example: {
        success: true,
        contract_id: 'CA123ABC...',
        unsigned_xdr: 'AAAAAG...',
        message: 'Escrow initialized successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or seller not registered',
  })
  async initializeEscrow(@Body() initDto: InitializeEscrowDto) {
    return this.trustlessWorkService.initializeEscrow(initDto);
  }

  @Post('send-transaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send signed transaction to Stellar network',
    description: 'Submits a signed XDR transaction to complete escrow creation',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction sent successfully',
    schema: {
      example: {
        success: true,
        transaction_hash: 'abc123...',
        message: 'Transaction sent successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing signature or invalid XDR',
  })
  async sendSignedTransaction(@Body() transactionDto: SendSignedTransactionDto) {
    return this.trustlessWorkService.sendSignedTransaction(transactionDto);
  }

  @Post('seller/:sellerKey/escrows')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get escrows for a specific seller',
    description: 'Retrieves all escrows where the seller is a participant',
  })
  async getSellerEscrows(
    @Param('sellerKey') sellerKey: string,
    @Body() queryDto: Omit<GetEscrowsBySignerDto, 'signer'>,
  ) {
    return this.trustlessWorkService.getEscrowsBySigner({
      ...queryDto,
      signer: sellerKey,
    });
  }

  // =====================
  // HEALTH CHECK
  // =====================

  @Get('health')
  @ApiOperation({ summary: 'Check Trustless Work API health' })
  async healthCheck() {
    const isHealthy = await this.trustlessWorkService.healthCheck();
    const config = this.trustlessWorkService.getApiConfiguration();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      configuration: config,
    };
  }

  // Deployment Endpoints
  @Post('deploy/single-release')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deploy a single release escrow contract' })
  @ApiResponse({ status: 201, description: 'Escrow deployed successfully' })
  async deploySingleReleaseEscrow(@Body() deployDto: DeploySingleReleaseEscrowDto) {
    return this.trustlessWorkService.deploySingleReleaseEscrow(deployDto);
  }

  @Post('deploy/multi-release')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deploy a multi release escrow contract' })
  @ApiResponse({ status: 201, description: 'Escrow deployed successfully' })
  async deployMultiReleaseEscrow(@Body() deployDto: DeployMultiReleaseEscrowDto) {
    return this.trustlessWorkService.deployMultiReleaseEscrow(deployDto);
  }

  // Funding Endpoints
  @Post('escrow/:type/fund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund an escrow contract' })
  @ApiParam({ name: 'type', enum: EscrowType, description: 'Escrow type' })
  @ApiResponse({ status: 200, description: 'Escrow funded successfully' })
  async fundEscrow(
    @Param('type') escrowType: EscrowType,
    @Body() fundDto: FundEscrowDto,
  ) {
    return this.trustlessWorkService.fundEscrow(escrowType, fundDto);
  }

  // Query Endpoints
  @Post('escrow/:type/details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get escrow details' })
  @ApiParam({ name: 'type', enum: EscrowType, description: 'Escrow type' })
  @ApiResponse({ status: 200, description: 'Escrow details retrieved successfully' })
  async getEscrowDetails(
    @Param('type') escrowType: EscrowType,
    @Body() getDto: GetEscrowDto,
  ) {
    return this.trustlessWorkService.getEscrowDetails(escrowType, getDto);
  }

  // Milestone Management
  @Post('escrow/:type/approve-milestone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a milestone' })
  @ApiParam({ name: 'type', enum: EscrowType, description: 'Escrow type' })
  @ApiResponse({ status: 200, description: 'Milestone approved successfully' })
  async approveMilestone(
    @Param('type') escrowType: EscrowType,
    @Body() approveDto: ApproveMilestoneDto,
  ) {
    return this.trustlessWorkService.approveMilestone(escrowType, approveDto);
  }

  // Fund Release
  @Post('escrow/:type/release-funds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release escrow funds' })
  @ApiParam({ name: 'type', enum: EscrowType, description: 'Escrow type' })
  @ApiResponse({ status: 200, description: 'Funds released successfully' })
  async releaseFunds(
    @Param('type') escrowType: EscrowType,
    @Body() releaseDto: ReleaseFundsDto,
  ) {
    return this.trustlessWorkService.releaseFunds(escrowType, releaseDto);
  }

  @Post('escrow/multi-release/release-milestone-funds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release milestone funds for multi-release escrow' })
  @ApiResponse({ status: 200, description: 'Milestone funds released successfully' })
  async releaseMilestoneFunds(@Body() releaseDto: ReleaseMilestoneFundsDto) {
    return this.trustlessWorkService.releaseMilestoneFunds(releaseDto);
  }

  // Dispute Management
  @Post('escrow/:type/dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a dispute for an escrow' })
  @ApiParam({ name: 'type', enum: EscrowType, description: 'Escrow type' })
  @ApiResponse({ status: 200, description: 'Dispute created successfully' })
  async disputeEscrow(
    @Param('type') escrowType: EscrowType,
    @Body() disputeDto: DisputeEscrowDto,
  ) {
    return this.trustlessWorkService.disputeEscrow(escrowType, disputeDto);
  }

  @Post('escrow/:type/resolve-dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiParam({ name: 'type', enum: EscrowType, description: 'Escrow type' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  async resolveDispute(
    @Param('type') escrowType: EscrowType,
    @Body() resolveDto: ResolveDisputeDto,
  ) {
    return this.trustlessWorkService.resolveDispute(escrowType, resolveDto);
  }

  // Update Operations
  @Post('escrow/:type/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update escrow details' })
  @ApiParam({ name: 'type', enum: EscrowType, description: 'Escrow type' })
  @ApiResponse({ status: 200, description: 'Escrow updated successfully' })
  async updateEscrow(
    @Param('type') escrowType: EscrowType,
    @Body() updateDto: UpdateEscrowDto,
  ) {
    return this.trustlessWorkService.updateEscrow(escrowType, updateDto);
  }

  // Helper Endpoints
  @Post('helper/set-trustline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set trustline for an account' })
  @ApiResponse({ status: 200, description: 'Trustline set successfully' })
  async setTrustline(@Body() trustlineDto: SetTrustlineDto) {
    return this.trustlessWorkService.setTrustline(trustlineDto);
  }

  @Post('helper/send-transaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a signed transaction to Stellar' })
  @ApiResponse({ status: 200, description: 'Transaction sent successfully' })
  async sendTransaction(@Body() transactionDto: SendTransactionDto) {
    return this.trustlessWorkService.sendTransaction(transactionDto);
  }

  @Post('helper/escrows-by-signer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get escrows by signer' })
  @ApiResponse({ status: 200, description: 'Escrows retrieved successfully' })
  async getEscrowsBySigner(@Body() queryDto: GetEscrowsBySignerDto) {
    return this.trustlessWorkService.getEscrowsBySigner(queryDto);
  }

  @Post('helper/escrows-by-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get escrows by role' })
  @ApiResponse({ status: 200, description: 'Escrows retrieved successfully' })
  async getEscrowsByRole(@Body() queryDto: GetEscrowsByRoleDto) {
    return this.trustlessWorkService.getEscrowsByRole(queryDto);
  }
}