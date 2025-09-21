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
} from '@nestjs/common';
import { TrustlessWorkService, CreateEscrowDto } from '../services/trustless-work.service';

@Controller('trustless-work')
export class TrustlessWorkController {
  constructor(private readonly trustlessWorkService: TrustlessWorkService) {}

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