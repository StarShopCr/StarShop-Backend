import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  rateLimitPoints: parseInt(process.env.RATE_LIMIT_POINTS || '100', 10),
  rateLimitDuration: parseInt(process.env.RATE_LIMIT_DURATION || '60', 10),
  trustProxy: process.env.TRUST_PROXY === 'true',
  bodyLimit: process.env.BODY_LIMIT || '1mb',
  cspDefaultSrc: process.env.CSP_DEFAULT_SRC || "'self'",
}));
