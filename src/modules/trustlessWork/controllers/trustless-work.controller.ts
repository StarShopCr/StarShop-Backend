import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { TrustlessWorkService, CreateEscrowDto } from '../services/trustless-work.service';
import { InitializeEscrowDto } from '../dtos/trustless-work.dto';

@Controller('trustless-work')
export class TrustlessWorkController {
  constructor(private readonly trustlessWorkService: TrustlessWorkService) {}

    /**
   * Initialize escrow contract (Issue #3)
   */
  @Post('escrow/initialize')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async initializeEscrow(@Body() initializeDto: InitializeEscrowDto) {
    try {
      // Validate seller registration first
      const isSellerRegistered = await this.trustlessWorkService.checkSellerRegistration(
        initializeDto.sellerPublicKey
      );

      if (!isSellerRegistered) {
        throw new BadRequestException('Seller must be registered on-chain');
      }

      // Create escrow and generate XDR
      const result = await this.trustlessWorkService.initializeEscrow(initializeDto);
      
      return {
        success: true,
        contractId: result.contractId,
        xdr: result.xdr,
        message: 'Escrow initialized successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to initialize escrow');
    }
  }

  /**
   * Check if seller is registered on-chain
   */
  @Get('seller/check/:publicKey')
  async checkSellerRegistration(@Param('publicKey') publicKey: string) {
    const isRegistered = await this.trustlessWorkService.checkSellerRegistration(publicKey);
    return { isRegistered };
  }

  /**
   * Get escrows for a specific seller
   */
  @Get('escrow/seller/:publicKey')
  async getSellerEscrows(@Param('publicKey') publicKey: string) {
    return this.trustlessWorkService.getSellerEscrows(publicKey);
  }

  /**
   * Confirm transaction and save escrow data
   */
  @Post('escrow/confirm')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async confirmEscrow(@Body() confirmDto: { transactionHash: string; contractId: string }) {
    return this.trustlessWorkService.confirmEscrow(confirmDto);
  }

  /**
   * Get service configuration
   */
  @Get('config')
  getConfig() {
    return this.trustlessWorkService.getConfig();
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    return this.trustlessWorkService.healthCheck();
  }

  /**
   * Create a new escrow
   */
  @Post('escrow')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createEscrow(@Body() createEscrowDto: CreateEscrowDto) {
    return this.trustlessWorkService.createEscrow(createEscrowDto);
  }

  /**
   * Get all escrows for current user
   */
  @Get('escrow')
  async getUserEscrows() {
    return this.trustlessWorkService.getUserEscrows();
  }

  /**
   * Get specific escrow by ID
   */
  @Get('escrow/:id')
  async getEscrow(@Param('id') id: string) {
    return this.trustlessWorkService.getEscrow(id);
  }

  /**
   * Release escrow funds
   */
  @Post('escrow/:id/release')
  @HttpCode(HttpStatus.OK)
  async releaseEscrow(@Param('id') id: string) {
    return this.trustlessWorkService.releaseEscrow(id);
  }

  /**
   * Cancel escrow
   */
  @Post('escrow/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelEscrow(@Param('id') id: string) {
    return this.trustlessWorkService.cancelEscrow(id);
  }
}