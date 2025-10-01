import './config/crypto-global';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BuyerRequestSchedulerService } from './modules/buyer-requests/services/buyer-request-scheduler.service';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Middleware to track request start time for latency
  app.use((req, res, next) => {
    req._startTime = Date.now();
    next();
  });

  // Enable CORS with allowlist from config
  const allowedOrigins = configService.get<string[]>('security.allowedOrigins', ['http://localhost:3000']);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );

  // Set body size limits
  app.use(bodyParser.json({ limit: configService.get<string>('security.bodyLimit', '1mb') }));
  app.use(bodyParser.urlencoded({ extended: true, limit: configService.get<string>('security.bodyLimit', '1mb') }));

  // Trust proxy if enabled
  if (configService.get<boolean>('security.trustProxy', false)) {
    const expressApp = app.getHttpAdapter().getInstance();
    if (expressApp && typeof expressApp.set === 'function') {
      expressApp.set('trust proxy', 1);
    }
  }

  // Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: [configService.get<string>('security.cspDefaultSrc', "'self'")],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      frameguard: { action: 'deny' },
      hsts: process.env.NODE_ENV === 'production' ? undefined : false,
      noSniff: true,
      xssFilter: true,
    })
  );

  // Global rate limiting guard
  app.useGlobalGuards(new ThrottlerGuard());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('StarShop API')
    .setDescription('The StarShop e-commerce API with Stellar blockchain integration')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'token',
      description: 'JWT token stored in HTTP-only cookie',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Close expired buyer requests on startup
  try {
    const schedulerService = app.get(BuyerRequestSchedulerService);
    const closedCount = await schedulerService.closeExpiredRequests();
    console.log(`Startup: Closed ${closedCount} expired buyer requests`);
  } catch (error) {
    console.error('Failed to close expired requests on startup:', error);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
