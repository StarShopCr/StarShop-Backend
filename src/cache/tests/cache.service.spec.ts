import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'CACHE_PREFIX':
            return 'test:';
          case 'CACHE_DEBUG':
            return false;
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should get data from cache', async () => {
      const mockData = { id: 1, name: 'Test Product' };
      mockCacheManager.get.mockResolvedValue(mockData);

      const result = await service.get('product', 'detail', { id: 1 });

      expect(result).toEqual(mockData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test:product:detail:5d41402abc4b2a76b9719d911017c592');
    });

    it('should return null when cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get('product', 'list');

      expect(result).toBeNull();
      expect(mockCacheManager.get).toHaveBeenCalledWith('test:product:list');
    });

    it('should handle cache errors gracefully', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('product', 'detail', { id: 1 });

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set data in cache', async () => {
      const data = { id: 1, name: 'Test Product' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('product', 'detail', data, 300, { id: 1 });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'test:product:detail:5d41402abc4b2a76b9719d911017c592',
        data,
        300
      );
    });

    it('should handle cache set errors gracefully', async () => {
      const data = { id: 1, name: 'Test Product' };
      mockCacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set('product', 'detail', data, 300, { id: 1 })).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete cache entry', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.delete('product', 'detail', { id: 1 });

      expect(mockCacheManager.del).toHaveBeenCalledWith('test:product:detail:5d41402abc4b2a76b9719d911017c592');
    });

    it('should handle cache delete errors gracefully', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.delete('product', 'detail', { id: 1 })).resolves.not.toThrow();
    });
  });

  describe('invalidateEntity', () => {
    it('should log invalidation attempt', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      await service.invalidateEntity('product');

      expect(loggerSpy).toHaveBeenCalledWith('Cache INVALIDATE ENTITY: product (pattern: test:product:*)');
    });
  });

  describe('invalidateAction', () => {
    it('should log action invalidation attempt', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      await service.invalidateAction('product', 'list');

      expect(loggerSpy).toHaveBeenCalledWith('Cache INVALIDATE ACTION: product:list (pattern: test:product:list:*)');
    });
  });

  describe('reset', () => {
    it('should reset entire cache', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });

    it('should handle cache reset errors gracefully', async () => {
      mockCacheManager.reset.mockRejectedValue(new Error('Cache error'));

      await expect(service.reset()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const stats = await service.getStats();

      expect(stats).toEqual({
        prefix: 'test:',
        debugMode: false,
        timestamp: expect.any(String),
      });
    });
  });

  describe('key generation', () => {
    it('should generate consistent keys for same parameters', async () => {
      const params1 = { category: 1, sort: 'name' };
      const params2 = { category: 1, sort: 'name' };

      const key1 = service['generateKey']('product', 'list', params1);
      const key2 = service['generateKey']('product', 'list', params2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', async () => {
      const params1 = { category: 1 };
      const params2 = { category: 2 };

      const key1 = service['generateKey']('product', 'list', params1);
      const key2 = service['generateKey']('product', 'list', params2);

      expect(key1).not.toBe(key2);
    });

    it('should generate simple key when no parameters', async () => {
      const key = service['generateKey']('product', 'list');

      expect(key).toBe('test:product:list');
    });
  });
});
