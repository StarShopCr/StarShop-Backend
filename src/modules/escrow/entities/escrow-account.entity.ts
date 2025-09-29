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
import { Offer } from '../../offers/entities/offer.entity';
import { Milestone } from './milestone.entity';
import { EscrowStatus } from '../enums/escrow-status.enum';

@Entity('escrow_accounts')
export class EscrowAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'offer_id' })
  offerId: string;

  @ManyToOne(() => Offer, { nullable: false })
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;

  @Column({ name: 'buyer_id' })
  buyerId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ name: 'seller_id' })
  sellerId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  releasedAmount: number;

  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.PENDING,
  })
  status: EscrowStatus;

  @OneToMany(() => Milestone, (milestone) => milestone.escrowAccount, {
    cascade: true,
  })
  milestones: Milestone[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
