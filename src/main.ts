import './config/crypto-global';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BuyerRequestSchedulerService } from './modules/buyer-requests/services/buyer-request-scheduler.service';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { PinoLoggerService } from './common/logger/pino-logger.service';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Request ID middleware
  app.use(new RequestIdMiddleware().use);

  // Get logger
  const logger = app.get(PinoLoggerService);

  // Enable CORS
  app.enableCors();

  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );

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
    logger.log(`Startup: Closed ${closedCount} expired buyer requests`, 'Bootstrap');
  } catch (error) {
    logger.error('Failed to close expired requests on startup', error.stack, 'Bootstrap');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger documentation: http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
