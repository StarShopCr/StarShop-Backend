import { Repository } from 'typeorm';
import { CouponService } from '../../modules/coupons/services/coupon.service';
import { Coupon, CouponUsage } from '../../modules/coupons/entities/coupon.entity';
import { CouponType } from '../../modules/coupons/dto/coupon.dto';
import { CreateCouponDto } from '../../modules/coupons/dto/coupon.dto';
import { dataSource } from '../../tests/setup';

describe('CouponService', () => {
  let couponService: CouponService;
  let couponRepository: Repository<Coupon>;
  let couponUsageRepository: Repository<CouponUsage>;

  beforeEach(async () => {
    couponRepository = dataSource.getRepository(Coupon);
    couponUsageRepository = dataSource.getRepository(CouponUsage);
    couponService = new CouponService(dataSource);
  });

  describe('createCoupon', () => {
    it('should create and save a new coupon', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'WELCOME10',
        type: CouponType.PERCENTAGE,
        value: 10,
        min_cart_value: 50,
        expires_at: '2025-12-31T23:59:59Z',
        max_uses: 100,
        created_by: 'admin-uuid-123',
      };

      const coupon = await couponService.createCoupon(createCouponDto);

      expect(coupon).toBeDefined();
      expect(coupon.code).toBe('WELCOME10');
      expect(coupon.type).toBe(CouponType.PERCENTAGE);
      expect(coupon.value).toBe(10);
      expect(coupon.min_cart_value).toBe(50);
      expect(new Date(coupon.expires_at)).toEqual(new Date('2025-12-31T23:59:59Z'));
      expect(coupon.max_uses).toBe(100);
      expect(coupon.created_by).toBe('admin-uuid-123');
    });
  });

  describe('validateCoupon', () => {
    let coupon: Coupon;

    beforeEach(async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'WELCOME10',
        type: CouponType.PERCENTAGE,
        value: 10,
        min_cart_value: 50,
        expires_at: '2025-12-31T23:59:59Z',
        max_uses: 2,
        created_by: 'admin-uuid-123',
      };
      coupon = await couponService.createCoupon(createCouponDto);
    });

    it('should validate a coupon successfully', async () => {
      const validatedCoupon = await couponService.validateCoupon('WELCOME10', 100);
      expect(validatedCoupon).toBeDefined();
      expect(validatedCoupon.code).toBe('WELCOME10');
    });

    it('should throw an error if coupon does not exist', async () => {
      await expect(couponService.validateCoupon('INVALID', 100)).rejects.toThrow(
        'Coupon not found'
      );
    });

    it('should throw an error if coupon is expired', async () => {
      const expiredCoupon = await couponService.createCoupon({
        code: 'EXPIRED',
        type: CouponType.FIXED,
        value: 5,
        expires_at: '2024-01-01T00:00:00Z',
        created_by: 'admin-uuid-123',
      });

      await expect(couponService.validateCoupon('EXPIRED', 100)).rejects.toThrow(
        'Coupon has expired'
      );
    });

    it('should throw an error if cart value is below minimum', async () => {
      await expect(couponService.validateCoupon('WELCOME10', 40)).rejects.toThrow(
        'Cart value is below minimum required'
      );
    });

    it('should throw an error if usage limit is reached', async () => {
      await couponUsageRepository.save({ coupon_id: coupon.id, user_id: 'user-1' });
      await couponUsageRepository.save({ coupon_id: coupon.id, user_id: 'user-2' });

      await expect(couponService.validateCoupon('WELCOME10', 100)).rejects.toThrow(
        'Coupon usage limit reached'
      );
    });
  });

  describe('applyCouponToOrder', () => {
    let coupon: Coupon;

    beforeEach(async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'WELCOME10',
        type: CouponType.PERCENTAGE,
        value: 10,
        min_cart_value: 50,
        expires_at: '2025-12-31T23:59:59Z',
        max_uses: 2,
        created_by: 'admin-uuid-123',
      };
      coupon = await couponService.createCoupon(createCouponDto);
    });

    it('should apply a percentage coupon to an order', async () => {
      const order = { id: 'order-123', total: 100 };
      const updatedOrder = await couponService.applyCouponToOrder(order, 'WELCOME10', 'user-1');

      expect(updatedOrder).toBeDefined();
      expect(updatedOrder.discount).toBe(10);
      expect(updatedOrder.total).toBe(90);
      expect(updatedOrder.id).toBe('order-123');

      const usage = await couponUsageRepository.findOne({
        where: { coupon_id: coupon.id, user_id: 'user-1' },
      });
      expect(usage).toBeDefined();
    });

    it('should apply a fixed coupon to an order', async () => {
      const fixedCoupon = await couponService.createCoupon({
        code: 'FIXED5',
        type: CouponType.FIXED,
        value: 5,
        created_by: 'admin-uuid-123',
      });

      const order = { id: 'order-123', total: 100 };
      const updatedOrder = await couponService.applyCouponToOrder(order, 'FIXED5', 'user-1');

      expect(updatedOrder).toBeDefined();
      expect(updatedOrder.discount).toBe(5);
      expect(updatedOrder.total).toBe(95);
      expect(updatedOrder.id).toBe('order-123');

      const usage = await couponUsageRepository.findOne({
        where: { coupon_id: fixedCoupon.id, user_id: 'user-1' },
      });
      expect(usage).toBeDefined();
    });

    it('should throw an error if coupon is invalid', async () => {
      const order = { id: 'order-123', total: 100 };
      await expect(couponService.applyCouponToOrder(order, 'INVALID', 'user-1')).rejects.toThrow(
        'Coupon not found'
      );
    });
  });
});
