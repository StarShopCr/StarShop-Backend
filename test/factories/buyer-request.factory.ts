import request from 'supertest';
import { INestApplication } from '@nestjs/common';

let requestCounter = 0;

export async function createBuyerRequest(app: INestApplication, cookie: string, overrides = {}) {
  requestCounter++;

  const res = await request(app.getHttpServer())
    .post('/api/v1/buyer-requests')
    .set('Cookie', cookie)
    .send({
      title: `Test Request ${requestCounter}`,
      description: 'Test description',
      budgetMin: 100,
      budgetMax: 200,
      categoryId: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    });

  return res.body.data || res.body;
}
