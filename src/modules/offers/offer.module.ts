import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Offer } from './entities/offer.entity';
import { OfferService } from './services/offer.service';
import { OfferController } from './offer.controller';
import { BuyerRequest } from '../buyer-requests/entities/buyer-request.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { NotificationService } from '../notifications/services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, BuyerRequest, User, Notification, Product])],
  controllers: [OfferController],
  providers: [OfferService, NotificationService],
  exports: [OfferService],
})
export class OfferModule {}
