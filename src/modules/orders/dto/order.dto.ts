import { Expose, Type } from 'class-transformer';
import { OrderStatus } from '../entities/order.entity';

export class OrderItemDto {
  @Expose()
  id: string;

  @Expose()
  product_id: string;

  @Expose()
  quantity: number;

  @Expose()
  price: number;

  @Expose()
  product_name: string;
}

export class OrderDto {
  @Expose()
  id: string;

  @Expose()
  status: OrderStatus;

  @Expose()
  total_price: number;

  @Expose()
  created_at: Date;

  @Expose()
  @Type(() => OrderItemDto)
  order_items: OrderItemDto[];
}
