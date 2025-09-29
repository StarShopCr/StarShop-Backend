import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SellerModule } from '../seller.module';
import { AuthModule } from '../../auth/auth.module';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/entities/user-role.entity';

describe('Seller (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let sellerId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Role, UserRole],
          synchronize: true,
          dropSchema: true,
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        SellerModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        walletAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      });

    authToken = authResponse.body.data.token;
    sellerId = authResponse.body.data.user.id;

    // Assign seller role to user
    await request(app.getHttpServer())
      .patch(`/users/${sellerId}/role`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ role: 'seller' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /seller/contract/build-register', () => {
    it('should build unsigned XDR successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/seller/contract/build-register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('unsignedXdr');
      expect(response.body.data).toHaveProperty('contractAddress');
      expect(typeof response.body.data.unsignedXdr).toBe('string');
      expect(typeof response.body.data.contractAddress).toBe('string');
    });

    it('should return 400 for invalid payout wallet format', async () => {
      await request(app.getHttpServer())
        .post('/seller/contract/build-register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          payoutWallet: 'invalid-wallet',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/seller/contract/build-register')
        .send({
          payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
        })
        .expect(401);
    });

    it('should return 409 when trying to register again', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/seller/contract/build-register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
        })
        .expect(200);

      // Submit the registration
      await request(app.getHttpServer())
        .post('/seller/contract/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signedXdr: 'AAAAAgAAAABqjgAAAAAA...',
        })
        .expect(200);

      // Try to register again - should fail
      await request(app.getHttpServer())
        .post('/seller/contract/build-register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
        })
        .expect(409);
    });
  });

  describe('POST /seller/contract/submit', () => {
    it('should submit signed XDR and update DB successfully', async () => {
      // First build the registration
      await request(app.getHttpServer())
        .post('/seller/contract/build-register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
        })
        .expect(200);

      // Then submit
      const response = await request(app.getHttpServer())
        .post('/seller/contract/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signedXdr: 'AAAAAgAAAABqjgAAAAAA...',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactionHash');
      expect(response.body.data).toHaveProperty('contractId');
      expect(response.body.data).toHaveProperty('payoutWallet');
      expect(response.body.data.registered).toBe(true);
    });

    it('should return 400 for missing signature', async () => {
      await request(app.getHttpServer())
        .post('/seller/contract/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signedXdr: '',
        })
        .expect(400);
    });

    it('should return 400 for invalid signed XDR', async () => {
      await request(app.getHttpServer())
        .post('/seller/contract/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signedXdr: 'invalid',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/seller/contract/submit')
        .send({
          signedXdr: 'AAAAAgAAAABqjgAAAAAA...',
        })
        .expect(401);
    });
  });

  describe('GET /seller/contract/status', () => {
    it('should return registration status', async () => {
      const response = await request(app.getHttpServer())
        .get('/seller/contract/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isRegistered');
      expect(response.body.data).toHaveProperty('payoutWallet');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/seller/contract/status')
        .expect(401);
    });
  });
});
