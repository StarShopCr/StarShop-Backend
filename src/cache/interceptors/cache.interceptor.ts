import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from '../cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    
    // Check if method is cacheable
    const cacheKeyMetadata = this.reflector.get(CACHE_KEY_METADATA, handler);
    const cacheTtlMetadata = this.reflector.get(CACHE_TTL_METADATA, handler);
    
    if (!cacheKeyMetadata) {
      return next.handle();
    }

    // Generate cache key based on method parameters
    const cacheKey = this.generateCacheKey(cacheKeyMetadata, request);
    
    // Try to get from cache first
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    // If not in cache, execute the method and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        const ttl = cacheTtlMetadata || 60; // Default TTL of 60 seconds
        await this.cacheManager.set(cacheKey, data, ttl);
      }),
    );
  }

  private generateCacheKey(metadata: any, request: any): string {
    const { key, entity, action } = metadata;
    
    // Extract parameters from request
    const params = {
      query: request.query,
      params: request.params,
      body: request.body,
      user: request.user?.id, // Include user ID if authenticated
    };

    // Use the cache service to generate a proper key
    return this.cacheService['generateKey'](entity || 'default', action || key, params);
  }
}
