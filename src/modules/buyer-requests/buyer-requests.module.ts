import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { BuyerRequestsService } from "./services/buyer-requests.service"
import { BuyerRequestsController } from "./controllers/buyer-requests.controller"
import { BuyerRequest } from "./entities/buyer-request.entity"

@Module({
  imports: [TypeOrmModule.forFeature([BuyerRequest])],
  controllers: [BuyerRequestsController],
  providers: [BuyerRequestsService],
  exports: [BuyerRequestsService],
})
export class BuyerRequestsModule {}
