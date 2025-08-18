import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { getConnection } from 'typeorm';

describe('Comments Module (e2e)', () => {
  let app: INestApplication;
  let tokenUserA: string;
  let tokenUserB: string;
  let buyerRequestId: number;
  let commentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Register users and get tokens
    const userA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'userA@test.com', password: '123456' });

    tokenUserA = userA.body.token;

    const userB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'userB@test.com', password: '123456' });

    tokenUserB = userB.body.token;

    // Create buyer request
    const buyerRequestRes = await request(app.getHttpServer())
      .post('/buyer-requests')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Need a graphic designer',
        description: 'Urgent design work',
        budgetMin: 100,
        budgetMax: 300,
        categoryId: 1,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

    buyerRequestId = buyerRequestRes.body.id;
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    await app.close();
  });

  it('✅ should allow authenticated user to post a comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/buyer-requests/${buyerRequestId}/comments`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ text: 'Is this still available?' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.text).toBe('Is this still available?');

    commentId = res.body.id;
  });

  it('❌ should fail to post comment when unauthenticated', async () => {
    const res = await request(app.getHttpServer())
      .post(`/buyer-requests/${buyerRequestId}/comments`)
      .send({ text: 'Can I help?' });

    expect(res.status).toBe(401);
  });

  it('❌ should not allow non-owner to delete comment', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(403);
  });

  it('✅ should fetch all comments for a buyer request', async () => {
    const res = await request(app.getHttpServer())
      .get(`/buyer-requests/${buyerRequestId}/comments`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page');
  });
});
