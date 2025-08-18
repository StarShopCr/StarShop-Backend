import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createTestUser } from './factories/user.factory';
import { createBuyerRequest } from './factories/buyer-request.factory';
import { getConnection } from 'typeorm';

describe('Comments Module (e2e)', () => {
  let app: INestApplication;
  let userA: any;
  let userB: any;
  let buyerRequestId: number;
  let commentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Create users with wallet-based auth
    userA = await createTestUser(app);
    userB = await createTestUser(app);

    const buyerRequest = await createBuyerRequest(app, userA.cookie);
    buyerRequestId = buyerRequest.id;
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    await app.close();
  });

  it('✅ should allow authenticated user to post a comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/buyer-requests/${buyerRequestId}/comments`)
      .set('Cookie', userA.cookie)
      .send({ text: 'Is this still available?' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.text).toBe('Is this still available?');

    commentId = res.body.data.id;
  });

  it('❌ should fail to post comment when unauthenticated', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/buyer-requests/${buyerRequestId}/comments`)
      .send({ text: 'Can I help?' });

    expect(res.status).toBe(401);
  });

  it('❌ should not allow non-owner to delete comment', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/comments/${commentId}`)
      .set('Cookie', userB.cookie);

    expect(res.status).toBe(403);
  });

  it('✅ should fetch all comments for a buyer request', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/buyer-requests/${buyerRequestId}/comments`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page');
  });
});
