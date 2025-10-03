import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse } from '../../common/decorators/api-response.decorator';

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
  @ApiSuccessResponse(201, 'Offer submitted successfully', Offer)
  @ApiErrorResponse(400, 'Bad request or closed buyer request')
  @ApiErrorResponse(404, 'Buyer request or product not found')
  async createOffer(@Body() createOfferDto: CreateOfferDto): Promise<Offer> {
    return this.offerService.create(createOfferDto);
  }
}
