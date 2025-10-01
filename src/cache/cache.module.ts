import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';
import { CacheController } from './controllers/cache.controller';
import { JwtService } from '@nestjs/jwt';
import { Role, RoleService, UserRole } from '@/modules/auth';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UserRole]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const ttl = parseInt(configService.get<string>('CACHE_TTL_SECONDS') ?? '60', 10);
        const prefix = configService.get<string>('CACHE_PREFIX') ?? 'app:';
        
        if (!redisUrl) {
          throw new Error('REDIS_URL environment variable is required for caching');
        }

        return {
          store: redisStore,
          url: redisUrl,
          ttl,
          prefix,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [CacheController],
  providers: [CacheService, JwtService, RoleService],
  exports: [CacheModule, CacheService],
})
export class AppCacheModule {}
