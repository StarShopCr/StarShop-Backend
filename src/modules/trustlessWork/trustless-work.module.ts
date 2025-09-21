import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TrustlessWorkService } from './services/trustless-work.service';
import { TrustlessWorkController } from './controllers/trustless-work.controller';

@Module({
  imports: [ConfigModule],
  providers: [TrustlessWorkService],
  controllers: [TrustlessWorkController],
  exports: [TrustlessWorkService], // Export service for use in other modules
})
export class TrustlessWorkModule {}