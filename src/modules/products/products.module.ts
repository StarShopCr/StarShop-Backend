import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { Product } from './entities/product.entity';
import { SharedModule } from '../shared/shared.module';
import { AppCacheModule } from '../../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), SharedModule, AppCacheModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductsModule {}
