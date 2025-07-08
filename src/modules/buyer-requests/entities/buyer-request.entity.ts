import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Offer } from '@/modules/offers/entities/offer.entity';

export enum BuyerRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  FULFILLED = 'fulfilled',
}

@Entity('buyer_requests')
export class BuyerRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budgetMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budgetMax: number;

  @Column()
  categoryId: number;

  @Column({
    type: 'enum',
    enum: BuyerRequestStatus,
    default: BuyerRequestStatus.OPEN,
  })
  status: BuyerRequestStatus;

  @Column()
  userId: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Offer, (offer) => offer.buyerRequest)
  offers: Offer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
