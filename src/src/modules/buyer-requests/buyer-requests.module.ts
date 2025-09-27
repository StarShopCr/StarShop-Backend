import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerRequestsService } from './services/buyer-requests.service';
import { BuyerRequestSchedulerService } from './services/buyer-request-scheduler.service';
import { BuyerRequestsController } from './controllers/buyer-requests.controller';
import { BuyerRequest } from './entities/buyer-request.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BuyerRequest, User])],
  controllers: [BuyerRequestsController],
  providers: [BuyerRequestsService, BuyerRequestSchedulerService],
  exports: [BuyerRequestsService, BuyerRequestSchedulerService],
})
export class BuyerRequestsModule {}
