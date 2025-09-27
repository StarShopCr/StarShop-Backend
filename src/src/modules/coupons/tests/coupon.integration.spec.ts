import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponModule } from '../coupon.module';
import { Coupon } from '../entities/coupon.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { CouponType } from '../dto/coupon.dto';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { RoleService } from '../../auth/services/role.service';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { RolesGuard } from '../../shared/guards/roles.guard';

describe('Coupon Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let dataSource: DataSource;

  const mockRoleService = {
    hasAnyRole: jest.fn().mockImplementation(() => Promise.resolve(true)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Coupon, CouponUsage],
          synchronize: true,
          logging: false,
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        CouponModule,
      ],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        Reflector,
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
    authToken = jwtService.sign({ userId: 'testUser', roles: ['admin'] });
  });

  beforeEach(async () => {
    // Clear the database before each test
    await dataSource.synchronize(true);
    // Reset mock implementations
    mockRoleService.hasAnyRole.mockReset();
    mockRoleService.hasAnyRole.mockImplementation(() => Promise.resolve(true));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const createTestCoupon = async (code: string) => {
    const createCouponDto = {
      code,
      type: CouponType.PERCENTAGE,
      value: 10,
      minPurchaseAmount: 50,
      maxDiscountAmount: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      usageLimit: 100,
      created_by: 'admin1',
    };

    return request(app.getHttpServer())
      .post('/coupons')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createCouponDto)
      .expect(201);
  };

  describe('POST /coupons', () => {
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

      const response = await request(app.getHttpServer())
        .post('/coupons')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createCouponDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe(createCouponDto.code);
      expect(response.body.type).toBe(createCouponDto.type);
      expect(response.body.value).toBe(createCouponDto.value);
    });

    it('should return 400 if coupon code already exists', async () => {
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

      // First create a coupon
      await createTestCoupon('TEST10');

      // Try to create another coupon with the same code
      const response = await request(app.getHttpServer())
        .post('/coupons')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createCouponDto)
        .expect(400);

      expect(response.body.message).toContain('Coupon code already exists');
    });
  });

  describe('GET /coupons/:code', () => {
    it('should return a coupon by code', async () => {
      const code = 'TEST10';
      await createTestCoupon(code);

      const response = await request(app.getHttpServer())
        .get(`/coupons/${code}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(code);
    });

    it('should return 404 if coupon not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/coupons/INVALID')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('Coupon not found');
    });
  });

  describe('POST /coupons/:code/validate', () => {
    it('should validate a coupon', async () => {
      const code = 'TEST10';
      const cartValue = 100;

      await createTestCoupon(code);

      const response = await request(app.getHttpServer())
        .post(`/coupons/${code}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cartValue })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe(code);
    });

    it('should return 404 if coupon not found', async () => {
      const cartValue = 100;

      const response = await request(app.getHttpServer())
        .post('/coupons/INVALID/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cartValue })
        .expect(404);

      expect(response.body.message).toContain('Coupon not found');
    });
  });

  describe('POST /coupons/:code/apply', () => {
    it('should apply a coupon to an order', async () => {
      const code = 'TEST10';
      const order = { id: '1', total: 100 };
      const user_id = 'user1';

      await createTestCoupon(code);

      const response = await request(app.getHttpServer())
        .post(`/coupons/${code}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order, user_id })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.total).toBe(90);
      expect(response.body.discount).toBe(10);
    });

    it('should return 404 if coupon is invalid', async () => {
      const order = { id: 'test-order', total: 100 };
      const user_id = 'test-user';

      const response = await request(app.getHttpServer())
        .post(`/coupons/INVALID/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order, user_id })
        .expect(404);

      expect(response.body.message).toBe('Coupon not found');
    });
  });
});
