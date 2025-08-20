import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Keypair } from 'stellar-sdk';

let userCounter = 0;

export async function createTestUser(app: INestApplication, overrides = {}) {
  userCounter++;

  const keypair = Keypair.random();
  const walletAddress = keypair.publicKey();
  const message = `StarShop Authentication Challenge - ${walletAddress} - ${Date.now()}`;
  const signatureBuffer = keypair.sign(Buffer.from(message, 'utf8'));
  const signature = signatureBuffer.toString('base64');

  const registerRes = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({
      walletAddress,
      signature,
      message,
      name: `User ${userCounter}`,
      email: `user${userCounter}@test.com`,
      ...overrides,
    });

  const cookies = registerRes.headers['set-cookie'];
  const tokenCookie = Array.isArray(cookies) ? cookies.find((c) => c.startsWith('token=')) : undefined;

  return {
    user: registerRes.body.data.user,
    walletAddress,
    message,
    signature,
    cookie: tokenCookie,
  };
}
