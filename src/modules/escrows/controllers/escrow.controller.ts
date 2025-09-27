import { Controller, Patch, Param, UseGuards, Request, Body, Get, Query, Post } from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@/types/role';
import { AuthRequest } from '@/modules/wishlist/common/types/auth-request.type';
import { UpdateMilestoneStatusDto } from '../dto/update-milestone-status.dto';
import { MilestoneStatus } from '../entities/milestone.entity';
import { GetEscrowsQueryDto } from '../dto/get-escrows-query.dto';
import { MultipleEscrowBalancesDto } from '../dto/multiple-balances.dto';

@Controller('escrows')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Patch(':escrowId/milestones/:milestoneId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  approve(
    @Param('escrowId') escrowId: string,
    @Param('milestoneId') milestoneId: string,
    @Request() req: AuthRequest
  ) {
    return this.escrowService.approveMilestone(escrowId, milestoneId, Number(req.user.id));
  }

  @Patch(':escrowId/milestones/:milestoneId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  changeStatus(
    @Param('escrowId') escrowId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: UpdateMilestoneStatusDto,
    @Request() req: AuthRequest
  ) {
    return this.escrowService.changeMilestoneStatus(
      escrowId,
      milestoneId,
      Number(req.user.id),
      body.status as MilestoneStatus
    );
  }

  // GET /escrows?role=buyer|seller (defaults to both roles for signer)
  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query() query: GetEscrowsQueryDto, @Request() req: AuthRequest) {
    const userId = Number(req.user.id);
    if (query.role) {
      return this.escrowService.getEscrowsByRole(userId, query.role);
    }
    return this.escrowService.getEscrowsBySigner(userId);
  }

  // POST /escrows/balances  { ids: [...] }
  @Post('balances')
  @UseGuards(JwtAuthGuard)
  balances(@Body() body: MultipleEscrowBalancesDto) {
    return this.escrowService.getMultipleEscrowBalances(body.ids);
  }
}
