import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowController } from './controllers/escrow.controller';
import { EscrowService } from './services/escrow.service';
import { EscrowAccount } from './entities/escrow-account.entity';
import { Milestone } from './entities/milestone.entity';
import { Offer } from '../offers/entities/offer.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EscrowAccount, Milestone, Offer]),
    AuthModule,
  ],
  controllers: [EscrowController],
  providers: [EscrowService],
})
export class EscrowModule {}