import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Escrow } from './entities/escrow.entity';
import { Milestone } from './entities/milestone.entity';
import { EscrowService } from './services/escrow.service';
import { EscrowController } from './controllers/escrow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Escrow, Milestone])],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowsModule {}
