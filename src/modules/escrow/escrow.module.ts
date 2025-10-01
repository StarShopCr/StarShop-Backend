import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowController } from './controllers/escrow.controller';
import { EscrowService } from './services/escrow.service';
import { EscrowAccount } from './entities/escrow-account.entity';
import { Milestone } from './entities/milestone.entity';
import { Offer } from '../offers/entities/offer.entity';
import { AuthModule } from '../auth/auth.module';
import { Escrow } from './entities/escrow.entity';
import { EscrowFundingTx } from './entities/escrow-funding-tx.entity';
import { BlockchainService } from './services/blockchain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EscrowAccount, Escrow, EscrowFundingTx, Milestone, Offer]),
    AuthModule,
  ],
  controllers: [EscrowController],
  providers: [EscrowService, BlockchainService],
})
export class EscrowModule {}
