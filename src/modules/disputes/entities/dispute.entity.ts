import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { User } from '../../users/entities/user.entity';

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

@Entity('disputes')
@Unique(['order_item'])
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderItem, { nullable: false })
  order_item: OrderItem;

  @ManyToOne(() => User, { nullable: false })
  buyer: User;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  created_at: Date;
}
