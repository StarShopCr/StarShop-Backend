import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ScheduleModule } from "@nestjs/schedule"
import { OffersService } from "./services/offers.service"
import { OfferService } from "./services/offer.service"
import { OfferAttachmentService } from "./services/offer-attachment.service"
import { OfferExpirationService } from "./services/offer-expiration.service"
import { OffersController } from "./controllers/offers.controller"
import { Offer } from "./entities/offer.entity"
import { OfferAttachment } from "./entities/offer-attachment.entity"
import { BuyerRequest } from "../buyer-requests/entities/buyer-request.entity"
import { FilesModule } from "../files/files.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, OfferAttachment, BuyerRequest]), 
    FilesModule,
    ScheduleModule.forRoot()
  ],
  controllers: [OffersController],
  providers: [OffersService, OfferService, OfferAttachmentService, OfferExpirationService],
  exports: [OffersService, OfferService, OfferAttachmentService, OfferExpirationService],
})
export class OffersModule {}