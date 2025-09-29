import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, Check } from 'typeorm';
import { Escrow } from './escrow.entity';

export enum MilestoneStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  READY = 'ready',          // Seller marked as ready to start
  IN_PROGRESS = 'in_progress', // Work is in progress
  DELIVERED = 'delivered',  // Seller delivered work for buyer approval
}

@Entity('escrow_milestones')
@Check('"amount" >= 0')
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'escrow_id' })
  escrowId: string;

  @ManyToOne(() => Escrow, (e) => e.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'escrow_id' })
  escrow: Escrow;

  @Column({ type: 'int' })
  sequence: number; // order of milestone

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status: MilestoneStatus;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
