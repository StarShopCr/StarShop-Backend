import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponService } from '../services/coupon.service';
import { Coupon } from '../entities/coupon.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';
import { CouponType } from '../dto/coupon.dto';

describe('CouponService', () => {
  let service: CouponService;
  let couponRepository: Repository<Coupon>;
  let usageRepository: Repository<CouponUsage>;

  const mockCoupon = {
    id: '1',
    code: 'TEST10',
    type: CouponType.PERCENTAGE,
    value: 10,
    minPurchaseAmount: 50,
    maxDiscountAmount: 100,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // tomorrow
    usageLimit: 100,
    isActive: true,
    created_by: 'admin1',
    save: jest.fn(),
  };

  const mockUsage = {
    id: '1',
    userId: 'user1',
    couponId: '1',
    usedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getRepositoryToken(Coupon),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(CouponUsage),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
    couponRepository = module.get<Repository<Coupon>>(getRepositoryToken(Coupon));
    usageRepository = module.get<Repository<CouponUsage>>(getRepositoryToken(CouponUsage));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCoupon', () => {
    it('should create a new coupon', async () => {
      const createCouponDto = {
        code: 'TEST10',
        type: CouponType.PERCENTAGE,
        value: 10,
        minPurchaseAmount: 50,
        maxDiscountAmount: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        usageLimit: 100,
        created_by: 'admin1',
      };

      jest.spyOn(couponRepository, 'create').mockReturnValue(mockCoupon as any);
      jest.spyOn(couponRepository, 'save').mockResolvedValue(mockCoupon as any);

      const result = await service.createCoupon(createCouponDto);

      expect(result).toEqual(mockCoupon);
      expect(couponRepository.create).toHaveBeenCalledWith(createCouponDto);
      expect(couponRepository.save).toHaveBeenCalled();
    });

    it('should throw ValidationError if coupon code already exists', async () => {
      const createCouponDto = {
        code: 'TEST10',
        type: CouponType.PERCENTAGE,
        value: 10,
        minPurchaseAmount: 50,
        maxDiscountAmount: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        usageLimit: 100,
        created_by: 'admin1',
      };

      jest.spyOn(couponRepository, 'findOne').mockResolvedValue(mockCoupon as any);

      await expect(service.createCoupon(createCouponDto)).rejects.toThrow(ValidationError);
    });
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon', async () => {
      const code = 'TEST10';
      const cartValue = 100;

      jest.spyOn(couponRepository, 'findOne').mockResolvedValue(mockCoupon as any);
      jest.spyOn(usageRepository, 'count').mockResolvedValue(50);

      const result = await service.validateCoupon(code, cartValue);

      expect(result).toEqual(mockCoupon);
    });

    it('should throw NotFoundError if coupon not found', async () => {
      const code = 'INVALID';
      const cartValue = 100;

      jest.spyOn(couponRepository, 'findOne').mockResolvedValue(null);

      await expect(service.validateCoupon(code, cartValue)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if coupon is expired', async () => {
      const code = 'TEST10';
      const cartValue = 100;

      jest.spyOn(couponRepository, 'findOne').mockResolvedValue({
        ...mockCoupon,
        endDate: new Date(Date.now() - 86400000), // yesterday
      } as any);

      await expect(service.validateCoupon(code, cartValue)).rejects.toThrow(ValidationError);
    });
  });

  describe('applyCouponToOrder', () => {
    it('should apply a valid coupon to order', async () => {
      const order = { id: '1', total: 100 };
      const code = 'TEST10';
      const userId = 'user1';

      jest.spyOn(couponRepository, 'findOne').mockResolvedValue(mockCoupon as any);
      jest.spyOn(usageRepository, 'count').mockResolvedValue(50);
      jest.spyOn(usageRepository, 'create').mockReturnValue(mockUsage as any);
      jest.spyOn(usageRepository, 'save').mockResolvedValue(mockUsage as any);

      const result = await service.applyCouponToOrder(order, code, userId);

      expect(result).toEqual({
        id: '1',
        total: 90,
        discount: 10,
      });
    });

    it('should throw ValidationError if coupon has reached usage limit', async () => {
      const order = { id: '1', total: 100 };
      const code = 'TEST10';
      const userId = 'user1';

      jest.spyOn(couponRepository, 'findOne').mockResolvedValue(mockCoupon as any);
      jest.spyOn(usageRepository, 'count').mockResolvedValue(100);

      await expect(service.applyCouponToOrder(order, code, userId)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
