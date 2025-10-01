import { Controller, Patch, Param, UseGuards, Request, Body } from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@/types/role';
import { AuthRequest } from '@/modules/wishlist/common/types/auth-request.type';
import { UpdateMilestoneStatusDto } from '../dto/update-milestone-status.dto';
import { MilestoneStatus } from '../entities/milestone.entity';

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
}
