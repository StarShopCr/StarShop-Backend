import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { OffersAdminService } from './services/offersAdmin.service';
import { OffersAdminController } from './controllers/offersAdmin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Offer])],
  controllers: [OffersAdminController],
  providers: [OffersAdminService],
})
export class OffersModule {}
