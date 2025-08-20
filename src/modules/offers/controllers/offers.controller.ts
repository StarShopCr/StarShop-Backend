import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { OffersService } from '../services/offers.service';
import { OfferService } from '../services/offer.service';
import { OfferAttachmentService } from '../services/offer-attachment.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { UploadAttachmentDto } from '../dto/upload-attachment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthRequest } from '@/modules/wishlist/common/types/auth-request.type';
import { Role } from '@/types/role';

@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly offerService: OfferService,
    private readonly offerAttachmentService: OfferAttachmentService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  create(@Body() createOfferDto: CreateOfferDto, @Request() req: AuthRequest) {
    return this.offersService.create(createOfferDto, Number(req.user.id));
  }

  @Get()
  findOffersForRequest(@Query('requestId') requestId: string) {
    if (!requestId) {
      throw new BadRequestException('The "requestId" query parameter is required.');
    }
    return this.offersService.findByBuyerRequest(Number(requestId));
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  accept(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.offersService.accept(id, String(req.user.id));
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  reject(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.offersService.reject(id, String(req.user.id));
  }

  @Patch(':id/confirm-purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  confirmPurchase(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.offersService.confirmPurchase(id, String(req.user.id));
  }

  @Get('all')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.offersService.findAll(page, limit);
  }

  @Get('my-offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  findMyOffers(
    @Request() req: AuthRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.offersService.findBySeller(Number(req.user.id), page, limit);
  }

  @Get('buyer-request/:buyerRequestId')
  findByBuyerRequest(@Param('buyerRequestId') buyerRequestId: string) {
    return this.offersService.findByBuyerRequest(Number(buyerRequestId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
    @Request() req: AuthRequest
  ) {
    return this.offersService.update(id, updateOfferDto, Number(req.user.id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.offersService.remove(id, Number(req.user.id));
  }

  @Post(':id/attachments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') offerId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadAttachmentDto: UploadAttachmentDto,
    @Request() req: AuthRequest
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.offerAttachmentService.uploadAttachment(
      offerId,
      file,
      Number(req.user.id),
      'cloudinary'
    );
  }

  @Get(':id/attachments')
  getAttachments(@Param('id') offerId: string) {
    return this.offerAttachmentService.getOfferAttachments(offerId);
  }

  @Delete('attachments/:attachmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  deleteAttachment(@Param('attachmentId') attachmentId: string, @Request() req: AuthRequest) {
    return this.offerAttachmentService.deleteAttachment(attachmentId, Number(req.user.id));
  }

  /**
   * Manual trigger for offer expiration (for testing purposes)
   * This endpoint allows developers to manually trigger the expiration process
   */
  @Post('expire-manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async manuallyExpireOffers() {
    const expiredCount = await this.offerService.expireOffers();
    return {
      message: 'Manual expiration completed',
      expiredCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if a specific offer has expired
   * Returns boolean indicating expiration status
   */
  @Get(':id/expired')
  async checkOfferExpiration(@Param('id') id: string) {
    const isExpired = await this.offerService.isOfferExpired(id);
    return {
      offerId: id,
      isExpired,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get offers that are expiring soon (within next hour)
   * Useful for monitoring and debugging
   */
  @Get('expiring-soon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getOffersExpiringSoon(
    @Query('hours', new DefaultValuePipe(1), ParseIntPipe) hours: number
  ) {
    const expiringOffers = await this.offerService.getOffersExpiringSoon(hours);
    return {
      count: expiringOffers.length,
      offers: expiringOffers,
      hours,
      timestamp: new Date().toISOString(),
    };
  }
}
