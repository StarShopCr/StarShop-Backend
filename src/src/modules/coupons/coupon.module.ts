import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponController } from './controllers/coupon.controller';
import { CouponService } from './services/coupon.service';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, CouponUsage]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
    SharedModule,
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
