import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { OffersAdminService } from '../services/offersAdmin.service';
import { BlockOfferDto } from '../dto/block-offer.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('admin/offers')
@UseGuards(RolesGuard)
@Roles('admin')
export class OffersAdminController {
  constructor(private readonly adminService: OffersAdminService) {}

  @Get()
  findAll() {
    return this.adminService.findAll();
  }

  @Patch(':id/block')
  block(@Param('id') id: string, @Body() dto: BlockOfferDto) {
    return this.adminService.block(id, dto.isBlocked ?? true);
  }
}
