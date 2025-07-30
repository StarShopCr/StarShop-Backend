import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';

export enum BuyerRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  FULFILLED = 'fulfilled',
}

@Entity('buyer_requests')
@Index('idx_buyer_requests_search', { synchronize: false }) // Full-text search index
@Index('idx_buyer_requests_category', ['categoryId'])
@Index('idx_buyer_requests_budget', ['budgetMin', 'budgetMax'])
@Index('idx_buyer_requests_expires_at', ['expiresAt'])
@Index('idx_buyer_requests_status', ['status'])
@Index('idx_buyer_requests_created_at', ['createdAt'])
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

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Offer, (offer: Offer) => offer.buyerRequest)
  offers: Offer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'tsvector', select: false, insert: false, update: false })
  searchVector?: string;
}
