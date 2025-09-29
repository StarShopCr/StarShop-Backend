import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EscrowAccount } from './escrow-account.entity';
import { MilestoneStatus } from '../enums/milestone-status.enum';

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'escrow_account_id' })
  escrowAccountId: string;

  @ManyToOne(() => EscrowAccount, (escrow) => escrow.milestones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'escrow_account_id' })
  escrowAccount: EscrowAccount;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @Column({ name: 'buyer_approved', default: false })
  buyerApproved: boolean;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
