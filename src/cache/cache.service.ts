import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly prefix: string;
  private readonly debugMode: boolean;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.prefix = this.configService.get<string>('CACHE_PREFIX') ?? 'app:';
    this.debugMode = this.configService.get<boolean>('CACHE_DEBUG') ?? false;
  }

  /**
   * Generate a cache key with proper naming convention
   */
  private generateKey(entity: string, action: string, params?: Record<string, any>): string {
    const baseKey = `${this.prefix}${entity}:${action}`;
    
    if (!params || Object.keys(params).length === 0) {
      return baseKey;
    }

    // Create a hash of the parameters to ensure consistent key generation
    const paramsString = JSON.stringify(params);
    const hash = crypto.createHash('md5').update(paramsString).digest('hex');
    
    return `${baseKey}:${hash}`;
  }

  /**
   * Get data from cache
   */
  async get<T>(entity: string, action: string, params?: Record<string, any>): Promise<T | null> {
    const key = this.generateKey(entity, action, params);
    
    try {
      const data = await this.cacheManager.get<T>(key);
      
      if (this.debugMode) {
        if (data) {
          this.logger.debug(`Cache HIT: ${key}`);
        } else {
          this.logger.debug(`Cache MISS: ${key}`);
        }
      }
      
      return data;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache with custom TTL
   */
  async set<T>(
    entity: string, 
    action: string, 
    data: T, 
    ttl?: number,
    params?: Record<string, any>
  ): Promise<void> {
    const key = this.generateKey(entity, action, params);
    
    try {
      await this.cacheManager.set(key, data, ttl);
      
      if (this.debugMode) {
        this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(entity: string, action: string, params?: Record<string, any>): Promise<void> {
    const key = this.generateKey(entity, action, params);
    
    try {
      await this.cacheManager.del(key);
      
      if (this.debugMode) {
        this.logger.debug(`Cache DELETE: ${key}`);
      }
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate all cache entries for an entity
   */
  async invalidateEntity(entity: string): Promise<void> {
    try {
      // Note: This is a simplified approach. In production, you might want to use
      // Redis SCAN command to find and delete all keys with the entity prefix
      const pattern = `${this.prefix}${entity}:*`;
      
      if (this.debugMode) {
        this.logger.debug(`Cache INVALIDATE ENTITY: ${entity} (pattern: ${pattern})`);
      }
      
      // For now, we'll rely on TTL expiration. In a more sophisticated setup,
      // you could implement pattern-based deletion using Redis SCAN
    } catch (error) {
      this.logger.error(`Cache invalidate entity error for ${entity}:`, error);
    }
  }

  /**
   * Invalidate cache entries for a specific action on an entity
   */
  async invalidateAction(entity: string, action: string): Promise<void> {
    try {
      const pattern = `${this.prefix}${entity}:${action}:*`;
      
      if (this.debugMode) {
        this.logger.debug(`Cache INVALIDATE ACTION: ${entity}:${action} (pattern: ${pattern})`);
      }
      
      // Similar to invalidateEntity, this would use Redis SCAN in production
    } catch (error) {
      this.logger.error(`Cache invalidate action error for ${entity}:${action}:`, error);
    }
  }

  /**
   * Clear entire cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      
      if (this.debugMode) {
        this.logger.debug('Cache RESET: All cache cleared');
      }
    } catch (error) {
      this.logger.error('Cache reset error:', error);
    }
  }

  /**
   * Get cache statistics (if available)
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      // This would return Redis INFO command results in production
      return {
        prefix: this.prefix,
        debugMode: this.debugMode,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return {};
    }
  }
}
