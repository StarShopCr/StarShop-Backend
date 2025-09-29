import { Controller, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@/types/role';
import { AuthRequest } from '@/modules/wishlist/common/types/auth-request.type';

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
}
