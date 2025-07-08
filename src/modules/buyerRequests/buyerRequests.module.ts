import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerRequest } from './entities/buyerRequest.entity';
import { BuyerRequestsAdminService } from './services/buyerRequestsAdmin.service';
import { BuyerRequestsAdminController } from './controllers/buyerRequestsAdmin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BuyerRequest])],
  controllers: [BuyerRequestsAdminController],
  providers: [BuyerRequestsAdminService],
})
export class BuyerRequestsModule {}
