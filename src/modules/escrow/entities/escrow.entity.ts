import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EscrowFundingTx } from './escrow-funding-tx.entity';

@Entity('escrows')
export class Escrow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expected_signer', type: 'varchar', length: 100 })
  expectedSigner: string;

  @Column({ name: 'balance', type: 'numeric', precision: 30, scale: 10, default: 0 })
  balance: string; // stored as string to avoid JS float issues

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => EscrowFundingTx, (tx) => tx.escrow)
  fundingTxs: EscrowFundingTx[];
}
