import { Expose, Type } from 'class-transformer';
import { OrderStatus, OnchainStatus } from '../entities/order.entity';

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
  escrow_contract_id?: string;

  @Expose()
  payment_tx_hash?: string;

  @Expose()
  onchain_status?: OnchainStatus;

  @Expose()
  created_at: Date;

  @Expose()
  @Type(() => OrderItemDto)
  order_items: OrderItemDto[];
}
