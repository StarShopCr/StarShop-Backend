import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OffersService } from "./services/offers.service"
import { OfferAttachmentService } from "./services/offer-attachment.service"
import { OffersController } from "./controllers/offers.controller"
import { Offer } from "./entities/offer.entity"
import { OfferAttachment } from "./entities/offer-attachment.entity"
import { BuyerRequest } from "../buyer-requests/entities/buyer-request.entity"
import { FilesModule } from "../files/files.module"
import { User } from "../users/entities/user.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Offer, User,OfferAttachment, BuyerRequest]), FilesModule],
  controllers: [OffersController],
  providers: [OffersService, OfferAttachmentService],
  exports: [OffersService, OfferAttachmentService],
})
export class OffersModule {}