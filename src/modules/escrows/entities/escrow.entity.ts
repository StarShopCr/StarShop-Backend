import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, Check } from 'typeorm';
import { Offer } from '../../offers/entities/offer.entity';
import { User } from '../../users/entities/user.entity';
import { Milestone } from './milestone.entity';

export enum EscrowStatus {
  PENDING = 'pending',      // Has milestones not yet approved
  IN_PROGRESS = 'in_progress', // At least one milestone approved but not all
  COMPLETED = 'completed',  // All milestones approved
}

@Entity('escrows')
@Check('"totalAmount" >= 0')
export class Escrow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'offer_id' })
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

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.PENDING })
  status: EscrowStatus;

  @OneToMany(() => Milestone, (m) => m.escrow, { cascade: true })
  milestones: Milestone[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
