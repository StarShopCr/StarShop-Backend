import './config/crypto-global';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BuyerRequestSchedulerService } from './modules/buyer-requests/services/buyer-request-scheduler.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );

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
