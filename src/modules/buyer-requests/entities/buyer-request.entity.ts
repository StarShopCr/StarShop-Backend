import { Offer } from '@/modules/offers/entities/offer.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// Import will be resolved at runtime to avoid circular dependency

export enum BuyerRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  FULFILLED = 'fulfilled',
}

@Entity('buyer_requests')
export class BuyerRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO : We need to complete the following fields


  @OneToMany('Offer', (offer: Offer) => offer.buyerRequest)
  offers: Offer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
