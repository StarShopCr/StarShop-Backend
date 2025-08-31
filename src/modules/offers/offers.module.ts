import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OffersService } from "./services/offers.service"
import { OffersAdminService } from "./services/offersAdmin.service"
import { OfferAttachmentService } from "./services/offer-attachment.service"
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
  ],
  controllers: [OffersController, OffersAdminController],
  providers: [OffersService, OffersAdminService, OfferAttachmentService],
  exports: [OffersService, OfferAttachmentService],
})
export class OffersModule {}
