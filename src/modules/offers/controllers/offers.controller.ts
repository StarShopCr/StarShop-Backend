import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OffersService } from '../services/offers.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { GetOffersQueryDto } from '../dto/get-offers-query.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { AuthenticatedRequest } from 'src/types/auth-request.type';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new offer for a buyer request' })
  @ApiResponse({ status: 201, description: 'Offer created successfully.' })
  createOffer(@Body() createOfferDto: CreateOfferDto, @Request() req: AuthenticatedRequest) {
    return this.offersService.createOffer(createOfferDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'List all offers for a specific buyer request' })
  @ApiResponse({ status: 200, description: 'Offers retrieved successfully.' })
  getOffersForRequest(@Query() query: GetOffersQueryDto) {
    return this.offersService.getOffersForRequest(parseInt(query.requestId, 10));
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept an offer' })
  @ApiResponse({ status: 200, description: 'Offer accepted successfully.' })
  acceptOffer(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    return this.offersService.acceptOffer(id, Number(req.user.id));
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject an offer' })
  @ApiResponse({ status: 200, description: 'Offer rejected successfully.' })
  rejectOffer(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    return this.offersService.rejectOffer(id, Number(req.user.id));
  }
}