import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ScheduleModule } from "@nestjs/schedule"

import { OffersService } from "./services/offers.service"
import { OfferService } from "./services/offer.service"
import { OffersAdminService } from "./services/offersAdmin.service"
import { OfferAttachmentService } from "./services/offer-attachment.service"
import { OfferExpirationService } from "./services/offer-expiration.service"

import { OffersController } from "./controllers/offers.controller"
import { OffersAdminController } from "./controllers/offersAdmin.controller"

import { Offer } from "./entities/offer.entity"
import { OfferAttachment } from "./entities/offer-attachment.entity"
import { BuyerRequest } from "../buyer-requests/entities/buyer-request.entity"
import { Product } from "../products/entities/product.entity"

import { NotificationsModule } from "../notifications/notifications.module"
import { FilesModule } from "../files/files.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, OfferAttachment, BuyerRequest, Product]),
    NotificationsModule,
    FilesModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [OffersController, OffersAdminController],
  providers: [
    OffersService,
    OfferService,
    OffersAdminService,
    OfferAttachmentService,
    OfferExpirationService,
  ],
  exports: [
    OffersService,
    OfferService,
    OfferAttachmentService,
    OfferExpirationService,
  ],
})
export class OffersModule {}
