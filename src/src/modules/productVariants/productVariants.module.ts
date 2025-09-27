import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariantController } from './controllers/productVariants.controller';
import { ProductVariantService } from './services/productVariants.service';
import { ProductVariant } from './entities/productVariants.entity';
import { ProductsModule } from '../products/products.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVariant]), ProductsModule, SharedModule],
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
  exports: [ProductVariantService],
})
export class ProductVariantsModule {}
