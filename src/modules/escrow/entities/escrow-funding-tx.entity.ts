import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Escrow } from './escrow.entity';

@Entity('escrow_funding_txs')
export class EscrowFundingTx {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 150 })
  txHash: string;

  @Column({ name: 'amount', type: 'numeric', precision: 30, scale: 10 })
  amount: string;

  @ManyToOne(() => Escrow, (escrow) => escrow.fundingTxs, { onDelete: 'CASCADE' })
  escrow: Escrow;

  @Column({ name: 'escrow_id' })
  escrowId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
