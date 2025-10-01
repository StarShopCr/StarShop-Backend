import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import securityConfig from './security.config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [securityConfig],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (config) => ({
        ttl: config.get('security.rateLimitDuration'),
        limit: config.get('security.rateLimitPoints'),
      }),
      inject: [ConfigModule],
    }),
  ],
})
export class SecurityModule {}
