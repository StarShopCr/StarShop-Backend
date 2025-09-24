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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
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
  @ApiResponse({
    status: 200,
    description: 'Funds released successfully',
    type: ReleaseFundsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - milestone not approved, already released, or other validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only seller can release funds',
  })
  @ApiResponse({
    status: 404,
    description: 'Milestone not found',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Milestone approval status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - milestone cannot be approved in current state',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only buyer can approve milestones',
  })
  @ApiResponse({
    status: 404,
    description: 'Milestone not found',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Escrow account retrieved successfully',
    type: EscrowAccountDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only buyer or seller can view escrow account',
  })
  @ApiResponse({
    status: 404,
    description: 'Escrow account not found',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Milestone retrieved successfully',
    type: MilestoneDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only buyer or seller can view milestone',
  })
  @ApiResponse({
    status: 404,
    description: 'Milestone not found',
  })
  async getMilestoneById(
    @Param('milestoneId') milestoneId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<MilestoneDto> {
    return this.escrowService.getMilestoneById(milestoneId, Number(req.user.id));
  }
}
