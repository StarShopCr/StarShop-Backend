import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TrustlessWorkController } from './controllers/trustless-work.controller';
import { TrustlessWorkService } from './services/trustless-work.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [TrustlessWorkController],
  providers: [TrustlessWorkService],
  exports: [TrustlessWorkService],
})
export class TrustlessWorkModule {}