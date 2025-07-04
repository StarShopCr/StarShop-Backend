import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './controllers/offers.controller';
import { OffersService } from './services/offers.service';
import { Offer } from './entities/offer.entity';
import { BuyerRequest } from './entities/buyer-request.entity';
import { Product } from '../products/entities/product.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, BuyerRequest, Product]),
    SharedModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}