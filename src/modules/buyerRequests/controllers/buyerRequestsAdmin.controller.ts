import { Controller, Get, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BuyerRequestsAdminService } from '../services/buyerRequestsAdmin.service';
import { BlockBuyerRequestDto } from '../dto/block-buyer-request.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('admin/buyer-requests')
@UseGuards(RolesGuard)
@Roles('admin')
export class BuyerRequestsAdminController {
  constructor(private readonly adminService: BuyerRequestsAdminService) {}

  @Get()
  findAll() {
    return this.adminService.findAll();
  }

  @Patch(':id/block')
  block(@Param('id', ParseIntPipe) id: number, @Body() dto: BlockBuyerRequestDto) {
    return this.adminService.block(id, dto.isBlocked ?? true);
  }
}
