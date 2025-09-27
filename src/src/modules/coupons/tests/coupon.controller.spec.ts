import { Test, TestingModule } from '@nestjs/testing';
import { CouponController } from '../controllers/coupon.controller';
import { CouponService } from '../services/coupon.service';
import { CreateCouponDto, ApplyCouponDto } from '../dto/coupon.dto';
import { CouponType } from '../dto/coupon.dto';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';

describe('CouponController', () => {
  let controller: CouponController;
  let service: CouponService;

  const mockCoupon = {
    id: '1',
    code: 'TEST10',
    type: CouponType.PERCENTAGE,
    value: 10,
    minPurchaseAmount: 50,
    maxDiscountAmount: 100,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    usageLimit: 100,
    isActive: true,
    created_by: 'admin1',
    usages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn().mockResolvedValue({ userId: 'testUser' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponController],
      providers: [
        {
          provide: CouponService,
          useValue: {
            createCoupon: jest.fn(),
            getCouponByCode: jest.fn(),
            validateCoupon: jest.fn(),
            applyCouponToOrder: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CouponController>(CouponController);
    service = module.get<CouponService>(CouponService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCoupon', () => {
    it('should create a new coupon', async () => {
      const createCouponDto: CreateCouponDto = {
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

      jest.spyOn(service, 'createCoupon').mockResolvedValue(mockCoupon as any);

      const result = await controller.createCoupon(createCouponDto);

      expect(result).toEqual(mockCoupon);
      expect(service.createCoupon).toHaveBeenCalledWith(createCouponDto);
    });

    it('should throw BadRequestException if coupon code already exists', async () => {
      const createCouponDto: CreateCouponDto = {
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

      jest
        .spyOn(service, 'createCoupon')
        .mockRejectedValue(new ValidationError('Coupon code already exists'));

      await expect(controller.createCoupon(createCouponDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateCoupon', () => {
    it('should validate a coupon', async () => {
      const code = 'TEST10';
      const cartValue = 100;

      jest.spyOn(service, 'validateCoupon').mockResolvedValue(mockCoupon as any);

      const result = await controller.validateCoupon(code, cartValue);

      expect(result).toEqual(mockCoupon);
      expect(service.validateCoupon).toHaveBeenCalledWith(code, cartValue);
    });

    it('should throw NotFoundException if coupon not found', async () => {
      const code = 'TEST10';
      const cartValue = 100;

      jest
        .spyOn(service, 'validateCoupon')
        .mockRejectedValue(new NotFoundError('Coupon not found'));

      await expect(controller.validateCoupon(code, cartValue)).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyCouponToOrder', () => {
    it('should apply a coupon to an order', async () => {
      const code = 'TEST10';
      const applyCouponDto: ApplyCouponDto = {
        order: { id: '1', total: 100 },
        user_id: 'user1',
      };

      const expectedResult = {
        id: '1',
        total: 90,
        discount: 10,
      };

      jest.spyOn(service, 'applyCouponToOrder').mockResolvedValue(expectedResult);

      const result = await controller.applyCouponToOrder(code, applyCouponDto);

      expect(result).toEqual(expectedResult);
      expect(service.applyCouponToOrder).toHaveBeenCalledWith(
        applyCouponDto.order,
        code,
        applyCouponDto.user_id
      );
    });

    it('should throw BadRequestException if coupon is invalid', async () => {
      const code = 'TEST10';
      const applyCouponDto: ApplyCouponDto = {
        order: { id: '1', total: 100 },
        user_id: 'user1',
      };

      jest
        .spyOn(service, 'applyCouponToOrder')
        .mockRejectedValue(new ValidationError('Invalid coupon'));

      await expect(controller.applyCouponToOrder(code, applyCouponDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
