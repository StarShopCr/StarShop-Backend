import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), SharedModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule {}
