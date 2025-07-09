import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { OfferService } from './services/offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Offer } from './entities/offer.entity';

@ApiTags('Offers')
@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an offer to a buyer request' })
  @ApiResponse({ status: 201, description: 'Offer submitted successfully', type: Offer })
  @ApiResponse({ status: 400, description: 'Bad request or closed buyer request' })
  @ApiResponse({ status: 404, description: 'Buyer request or product not found' })
  async createOffer(@Body() createOfferDto: CreateOfferDto): Promise<Offer> {
    return this.offerService.create(createOfferDto);
  }
}
