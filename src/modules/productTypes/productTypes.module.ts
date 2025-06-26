import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTypeController } from './controllers/productTypes.controller';
import { ProductTypeService } from './services/productTypes.service';
import { ProductType } from './entities/productTypes.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductType]), SharedModule],
  controllers: [ProductTypeController],
  providers: [ProductTypeService],
  exports: [ProductTypeService],
})
export class ProductTypesModule {}
