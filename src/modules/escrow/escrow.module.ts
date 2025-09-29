import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Escrow } from './entities/escrow.entity';
import { EscrowFundingTx } from './entities/escrow-funding-tx.entity';
import { EscrowService } from './services/escrow.service';
import { EscrowController } from './controllers/escrow.controller';
import { BlockchainService } from './services/blockchain.service';

@Module({
  imports: [TypeOrmModule.forFeature([Escrow, EscrowFundingTx])],
  controllers: [EscrowController],
  providers: [EscrowService, BlockchainService],
  exports: [EscrowService],
})
export class EscrowModule {}
