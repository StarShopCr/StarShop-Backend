import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { CouponType, CreateCouponDto } from '../dto/coupon.dto';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>
  ) {}

  async createCoupon(data: CreateCouponDto): Promise<Coupon> {
    const existingCoupon = await this.couponRepository.findOne({ where: { code: data.code } });
    if (existingCoupon) {
      throw new ValidationError('Coupon code already exists');
    }
    const coupon = this.couponRepository.create(data);
    return this.couponRepository.save(coupon);
  }

  async getCouponByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }
    return coupon;
  }

  async validateCoupon(code: string, cartValue: number): Promise<Coupon> {
    const coupon = await this.getCouponByCode(code);

    if (coupon.endDate && new Date() > coupon.endDate) {
      throw new ValidationError('Coupon has expired');
    }

    if (coupon.minPurchaseAmount && cartValue < coupon.minPurchaseAmount) {
      throw new ValidationError('Cart value is below minimum required');
    }

    if (coupon.usageLimit) {
      const usageCount = await this.couponUsageRepository.count({
        where: { couponId: coupon.id },
      });
      if (usageCount >= coupon.usageLimit) {
        throw new ValidationError('Coupon usage limit reached');
      }
    }

    return coupon;
  }

  async applyCouponToOrder(
    order: { id: string; total: number },
    code: string,
    userId: string
  ): Promise<{ id: string; total: number; discount: number }> {
    const coupon = await this.validateCoupon(code, order.total);
    let discount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (order.total * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.value;
    }

    const updatedOrder = {
      ...order,
      discount,
      total: order.total - discount,
    };

    const couponUsage = this.couponUsageRepository.create({
      couponId: coupon.id,
      userId,
      usedAt: new Date(),
    });
    await this.couponUsageRepository.save(couponUsage);

    return updatedOrder;
  }
}
