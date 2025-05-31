import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderDto } from '../dto/order.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>
  ) {}

  async getOrdersByUser(userId: string): Promise<OrderDto[]> {
    const orders = await this.orderRepository.find({
      where: { user_id: userId },
      relations: ['order_items', 'order_items.product'],
      order: { created_at: 'DESC' },
    });

    return orders.map((order) => this.transformOrder(order));
  }

  async getOrderDetails(userId: string, orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId },
      relations: ['order_items', 'order_items.product'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return this.transformOrder(order);
  }

  private transformOrder(order: Order): OrderDto {
    const orderDto = plainToClass(OrderDto, order, {
      excludeExtraneousValues: true,
    });

    // Transform order items to include product name
    orderDto.order_items = order.order_items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product.name,
    }));

    return orderDto;
  }
}
