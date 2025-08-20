import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersService } from './services/offers.service';
import { OffersController } from './controllers/offers.controller';
import { OffersAdminController } from './controllers/offersAdmin.controller';
import { OffersAdminService } from './services/offersAdmin.service';
import { OfferAttachmentService } from './services/offer-attachment.service';
import { Offer } from './entities/offer.entity';
import { OfferAttachment } from './entities/offer-attachment.entity';
import { BuyerRequest } from '../buyer-requests/entities/buyer-request.entity';
import { NotificationsModule } from '../notifications/notifications.module'; // ✅ Importar NotificationsModule
import { FilesModule } from '../files/files.module'; // ✅ Importar FilesModule para OfferAttachmentService

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, OfferAttachment, BuyerRequest]),
    NotificationsModule, // ✅ Importar para usar NotificationService
    FilesModule, // ✅ Importar para que OfferAttachmentService tenga acceso a FileService
  ],
  controllers: [OffersController, OffersAdminController],
  providers: [OffersService, OffersAdminService, OfferAttachmentService],
  exports: [OffersService],
})
export class OffersModule {}