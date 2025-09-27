import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escrow } from '../entities/escrow.entity';
import { EscrowFundingTx } from '../entities/escrow-funding-tx.entity';
import { FundEscrowDto } from '../dto/fund-escrow.dto';
import { ForbiddenError, NotFoundError } from '../../../middleware/error.classes';
import { BlockchainService } from './blockchain.service';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Escrow) private readonly escrowRepo: Repository<Escrow>,
    @InjectRepository(EscrowFundingTx) private readonly txRepo: Repository<EscrowFundingTx>,
    private readonly blockchain: BlockchainService,
  ) {}

  async fundEscrow(id: string, dto: FundEscrowDto) {
    const escrow = await this.escrowRepo.findOne({ where: { id } });
    if (!escrow) throw new NotFoundError('Escrow not found');

    if (escrow.expectedSigner !== dto.signer) {
      throw new ForbiddenError('Signer does not match expected signer for this escrow');
    }

    const amountStr = dto.amount.toString();
    const txHash = await this.blockchain.fund(amountStr, dto.signer, id);

    // Update balance using numeric strings
    const newBalance = (parseFloat(escrow.balance) + dto.amount).toString();
    escrow.balance = newBalance;
    await this.escrowRepo.save(escrow);

    const tx = this.txRepo.create({ amount: amountStr, txHash, escrowId: escrow.id });
    await this.txRepo.save(tx);

    return {
      escrowId: escrow.id,
      txHash,
      balance: escrow.balance,
      amount: amountStr,
    };
  }
}
