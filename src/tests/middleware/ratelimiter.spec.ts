import request from 'supertest';
import express from 'express';
import { loginRateLimiter } from '../../middleware/ratelimiter.middleware';

const app = express();
app.use(express.json());
app.post('/login', loginRateLimiter, (req, res) => {
  res.status(200).send('Login successful');
});

describe('Rate Limiter Middleware', () => {
  it('should allow up to 5 login attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(app).post('/login').send({});
      expect(response.status).toBe(200);
    }
  });

  it('should block login attempts after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/login').send({});
    }
    const response = await request(app).post('/login').send({});
    expect(response.status).toBe(429);
    expect(response.body.message).toBe(
      'Too many login attempts from this IP, please try again after 15 minutes'
    );
  });
});
