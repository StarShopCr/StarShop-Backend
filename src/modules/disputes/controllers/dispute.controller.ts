import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { DisputeService } from '../services/dispute.service';
import { AuthenticatedRequest } from '../../shared/types/auth-request.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
  async startDispute(
    @Body('orderItemId') orderItemId: string,
    @Body('reason') reason: string,
    @Req() req: AuthenticatedRequest
  ): Promise<Record<string, unknown>> {
    const buyer = req.user;
    return this.disputeService.startDispute(orderItemId, buyer, reason);
  }
}
