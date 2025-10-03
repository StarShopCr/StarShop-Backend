import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Keypair } from 'stellar-sdk';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;
  const mockWalletAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  let mockSignature: string;
  let mockMessage: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply same global settings as production
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    // Generate a mock signature for testing
    const keypair = Keypair.random();
    mockMessage =
      'StarShop Authentication Challenge - GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF - 1234567890';
    const messageBuffer = Buffer.from(mockMessage, 'utf8');
    const signatureBuffer = keypair.sign(messageBuffer);
    mockSignature = signatureBuffer.toString('base64');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/challenge', () => {
    it('should generate challenge for valid wallet address', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/challenge')
        .send({ walletAddress: mockWalletAddress })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.challenge).toContain('StarShop Authentication Challenge');
      expect(response.body.data.challenge).toContain(mockWalletAddress);
      expect(response.body.data.walletAddress).toBe(mockWalletAddress);
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should reject invalid wallet address format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/challenge')
        .send({ walletAddress: 'invalid-address' })
        .expect(400);
    });
  });

  describe('POST /auth/register', () => {
    it('should register new user with valid signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: mockWalletAddress,
          signature: mockSignature,
          message: mockMessage,
          name: 'Test User',
          email: 'test@example.com',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.walletAddress).toBe(mockWalletAddress);
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.expiresIn).toBe(3600);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate wallet address', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: 'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE',
          signature: mockSignature,
          message: mockMessage,
        });

      // Second registration with same address
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: 'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE',
          signature: mockSignature,
          message: mockMessage,
        })
        .expect(400);
    });

    it('should reject invalid signature', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: mockWalletAddress,
          signature: 'invalid-signature',
          message: mockMessage,
        })
        .expect(401);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a user first
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: 'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE',
          signature: mockSignature,
          message: mockMessage,
        });
    });

    it('should login existing user with valid signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          walletAddress: 'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE',
          signature: mockSignature,
          message: mockMessage,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.walletAddress).toBe(
        'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE'
      );
      expect(response.body.data.expiresIn).toBe(3600);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject login for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          walletAddress: 'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE',
          signature: mockSignature,
          message: mockMessage,
        })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: 'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE',
          signature: mockSignature,
          message: mockMessage,
        });

      authToken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
    });

    it('should return user info with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.walletAddress).toBe(
        'GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE'
      );
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });

  describe('DELETE /auth/logout', () => {
    it('should clear authentication cookie', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/auth/logout')
        .set('Cookie', 'token=some-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});
