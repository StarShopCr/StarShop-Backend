import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreController } from './controllers/store.controller';
import { StoreService } from './services/store.service';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, User])],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoresModule {}
