import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse } from '../../../common/decorators/api-response.decorator';
import { EscrowService } from '../services/escrow.service';
import { ReleaseFundsDto } from '../dto/release-funds.dto';
import { ApproveMilestoneDto } from '../dto/approve-milestone.dto';
import { ReleaseFundsResponseDto, EscrowAccountDto, MilestoneDto } from '../dto/release-funds-response.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

@ApiTags('Escrow')
@Controller('escrow')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post('release-funds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release funds for a milestone',
    description: 'Release funds to seller after buyer approval. Only sellers can release funds for their milestones.',
  })
  @ApiBody({ type: ReleaseFundsDto })
  @ApiSuccessResponse(200, 'Funds released successfully', ReleaseFundsResponseDto)
  @ApiErrorResponse(400, 'Bad request - milestone not approved, already released, or other validation error')
  @ApiErrorResponse(403, 'Forbidden - only seller can release funds')
  @ApiErrorResponse(404, 'Milestone not found')
  async releaseFunds(
    @Body() releaseFundsDto: ReleaseFundsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReleaseFundsResponseDto> {
    return this.escrowService.releaseFunds(releaseFundsDto, Number(req.user.id));
  }

  @Post('approve-milestone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve or reject a milestone',
    description: 'Buyer approves or rejects a milestone. Required before funds can be released.',
  })
  @ApiBody({ type: ApproveMilestoneDto })
  @ApiSuccessResponse(200, 'Milestone approval status updated successfully')
  @ApiErrorResponse(400, 'Bad request - milestone cannot be approved in current state')
  @ApiErrorResponse(403, 'Forbidden - only buyer can approve milestones')
  @ApiErrorResponse(404, 'Milestone not found')
  async approveMilestone(
    @Body() approveMilestoneDto: ApproveMilestoneDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string; milestone: MilestoneDto }> {
    return this.escrowService.approveMilestone(approveMilestoneDto, Number(req.user.id));
  }

  @Get('offer/:offerId')
  @ApiOperation({
    summary: 'Get escrow account by offer ID',
    description: 'Retrieve escrow account details and milestones for an offer. Only buyer or seller can access.',
  })
  @ApiParam({
    name: 'offerId',
    description: 'ID of the offer',
    type: 'string',
    format: 'uuid',
  })
  @ApiSuccessResponse(200, 'Escrow account retrieved successfully', EscrowAccountDto)
  @ApiErrorResponse(403, 'Forbidden - only buyer or seller can view escrow account')
  @ApiErrorResponse(404, 'Escrow account not found')
  async getEscrowByOfferId(
    @Param('offerId') offerId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<EscrowAccountDto> {
    return this.escrowService.getEscrowByOfferId(offerId, Number(req.user.id));
  }

  @Get('milestone/:milestoneId')
  @ApiOperation({
    summary: 'Get milestone by ID',
    description: 'Retrieve milestone details. Only buyer or seller can access.',
  })
  @ApiParam({
    name: 'milestoneId',
    description: 'ID of the milestone',
    type: 'string',
    format: 'uuid',
  })
  @ApiSuccessResponse(200, 'Milestone retrieved successfully', MilestoneDto)
  @ApiErrorResponse(403, 'Forbidden - only buyer or seller can view milestone')
  @ApiErrorResponse(404, 'Milestone not found')
  async getMilestoneById(
    @Param('milestoneId') milestoneId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<MilestoneDto> {
    return this.escrowService.getMilestoneById(milestoneId, Number(req.user.id));
=======
import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { FundEscrowDto } from '../dto/fund-escrow.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('escrows')
@Controller('api/v1/escrows')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post(':id/fund')
  @ApiOperation({ summary: 'Fund an escrow' })
  async fund(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: FundEscrowDto,
  ) {
    return this.escrowService.fundEscrow(id, dto);
  }
}
