import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';

export interface CacheOptions {
  key: string;
  ttl?: number;
  entity?: string;
  action?: string;
}

/**
 * Decorator to mark a method for caching
 */
export const Cacheable = (options: CacheOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, {
      key: options.key,
      entity: options.entity,
      action: options.action,
    })(target, propertyKey, descriptor);
    
    if (options.ttl) {
      SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
    }
    
    return descriptor;
  };
};

/**
 * Decorator to mark a method that should invalidate cache
 */
export const CacheInvalidate = (entity: string, action?: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache_invalidate', { entity, action })(target, propertyKey, descriptor);
    return descriptor;
  };
};

/**
 * Decorator to mark a method that should clear all cache
 */
export const CacheClear = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache_clear', true)(target, propertyKey, descriptor);
    return descriptor;
  };
};
