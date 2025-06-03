import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from './modules/shared/shared.module';
import { CouponModule } from './modules/coupons/coupon.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductTypesModule } from './modules/productTypes/productTypes.module';
import { ProductVariantsModule } from './modules/productVariants/productVariants.module';
import { AttributeModule } from './modules/attributes/attributes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'starshop',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Set to false in production
    }),
    SharedModule,
    CouponModule,
    ProductsModule,
    ProductTypesModule,
    ProductVariantsModule,
    AttributeModule,
  ],
})
export class AppModule {}
