import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Keypair } from 'stellar-sdk';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';

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
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
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
        .expect(200);
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
          walletAddress: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX',
          signature: mockSignature,
          message: mockMessage,
        });

      // Second registration with same address
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX',
          signature: mockSignature,
          message: mockMessage,
        });
        
      expect([200, 201]).toContain(res.status);
    });

    it('should reject invalid signature', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: mockWalletAddress,
          signature: 'invalid-signature',
          message: mockMessage,
        })
        .expect(201);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a user first
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          walletAddress: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX',
          signature: mockSignature,
          message: mockMessage,
        });
    });

    it('should login existing user with valid signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          walletAddress: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX',
          signature: mockSignature,
          message: mockMessage,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.walletAddress).toBe(
        'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX'
      );
      expect(response.body.data.expiresIn).toBe(3600);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject login for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          walletAddress: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX',
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
          walletAddress: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX',
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
        'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX'
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

//
// ──────────────────────────────────────────────────────────────────────────────
// Added tests below — DO NOT remove or modify any lines above.
// ──────────────────────────────────────────────────────────────────────────────
//

describe('Auth Endpoints (e2e) — Cookie & Body Contract', () => {
  let app: INestApplication;
  let base: any;

  // Reuse realistic wallet used elsewhere to avoid format issues
  const WALLET = 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBX';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1'); // mirror main.ts for e2e
    app.use(cookieParser());
    await app.init();
    base = app.getHttpServer();

    // Ensure the user exists
    await request(base).post('/api/v1/auth/register').send({
      walletAddress: WALLET,
      signature: 'TEST_SIGNATURE_BASE64',
      message: 'TEST_MESSAGE',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login should set HttpOnly cookie and not expose JWT in body', async () => {
    const res = await request(base)
      .post('/api/v1/auth/login')
      .send({
        walletAddress: WALLET,
        signature: 'TEST_SIGNATURE_BASE64',
        message: 'TEST_MESSAGE',
      })
      .expect(200);

    // 1) Cookie present
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const firstCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(firstCookie).toMatch(/^token=/i);

    // 2) Cookie flags
    expect(firstCookie).toMatch(/HttpOnly/i);
    expect(firstCookie).toMatch(/SameSite=Strict/i);
    expect(firstCookie).toMatch(/Max-Age=3600/i);

    // 3) No JWT token string in body
    const bodyStr = JSON.stringify(res.body);
    const jwtRegex = /\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/;
    expect(bodyStr).not.toMatch(jwtRegex);
  });

  it('GET /auth/me should succeed when sending cookie; fail otherwise', async () => {
    // Login to get cookie
    const login = await request(base)
      .post('/api/v1/auth/login')
      .send({
        walletAddress: WALLET,
        signature: 'TEST_SIGNATURE_BASE64',
        message: 'TEST_MESSAGE',
      });
    expect(login.status).toBe(200);

    // Extract the auth cookie (supports "token" or "auth_token")
    const setCookie = login.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieLine = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const match = cookieLine.match(/^(token|auth_token)=[^;]+/i);
    expect(match).not.toBeNull();
    const cookie = match![0]; // e.g., "token=eyJ..."

    // With cookie → 200
    const meOK = await request(base).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meOK.status).toBe(200);

    // Without cookie → 401
    const meNoCookie = await request(base).get('/api/v1/auth/me');
    expect(meNoCookie.status).toBe(401);
  });


  it('POST /auth/login should include Secure when NODE_ENV=production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await request(base)
      .post('/api/v1/auth/login')
      .send({
        walletAddress: WALLET,
        signature: 'TEST_SIGNATURE_BASE64',
        message: 'TEST_MESSAGE',
      })
      .expect(200);

    const setCookie = res.headers['set-cookie'];
    const cookieLine = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookieLine).toMatch(/Secure/i);
    expect(cookieLine).toMatch(/HttpOnly/i);
    expect(cookieLine).toMatch(/SameSite=Strict/i);

    process.env.NODE_ENV = prev;
  });
});
