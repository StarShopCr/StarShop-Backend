import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductType } from '../../productTypes/entities/productTypes.entity';
import AppDataSource from '../../../config/ormconfig';
import { AppDataSource as DatabaseAppDataSource } from '../../../config/database';
import { NotFoundError } from '../../../utils/errors';
import { CacheService } from '../../../cache/cache.service';
import { Cacheable, CacheInvalidate } from '../../../cache/decorators/cache.decorator';

export interface ProductFilters {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
}

export type SortBy = 'price_asc' | 'price_desc' | 'newest' | 'popular';

interface GetAllProductsOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sort?: string;
}

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  sellerId: number;
}

interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
}

export class ProductService {
  private repository: Repository<Product>;
  private productRepository: Repository<Product>;

  constructor(private cacheService: CacheService) {
    this.repository = AppDataSource.getRepository(Product);
    this.productRepository = DatabaseAppDataSource.getRepository(Product);
  }

  async create(data: Partial<Product>, productTypeId: number): Promise<Product | null> {
    const productTypeRepo = AppDataSource.getRepository(ProductType);
    const productType = await productTypeRepo.findOne({ where: { id: productTypeId } });

    if (!productType) throw new Error(`ProductType with id ${productTypeId} not found`);
    if (!data.name) throw new Error('Name is required');

    const product = this.repository.create({ ...data, productType });

    try {
      const response = await this.repository.save(product);
      if (!response?.id) throw new Error('Database error');
      
      // Invalidate product cache after creation
      await this.cacheService.invalidateEntity('product');
      
      return response;
    } catch (error) {
      throw new Error('Database error');
    }
  }

  @Cacheable({ key: 'products', entity: 'product', action: 'list' })
  async getAll(filters?: {
    category?: number;
    minPrice?: number;
    maxPrice?: number;
    availability?: boolean;
    minRating?: number;
    sortBy?: 'price' | 'createdAt' | 'popularity';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<Product[]> {
    const query = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productType', 'productType')
      .leftJoinAndSelect('product.variants', 'variants');

    if (filters?.category !== undefined) {
      query.andWhere('productType.id = :category', { category: filters.category });
    }

    if (filters?.minPrice !== undefined) {
      query.andWhere('variants.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters?.maxPrice !== undefined) {
      query.andWhere('variants.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters?.availability !== undefined) {
      if (filters.availability) {
        query.andWhere('variants.stock > 0');
      } else {
        query.andWhere('variants.stock <= 0');
      }
    }

    // Note: minRating filter is commented out because averageRating field doesn't exist
    /*
    if (filters?.minRating !== undefined) {
      query.andWhere('product.averageRating >= :minRating', { minRating: filters.minRating });
    }
    */

    if (filters?.sortBy) {
      const order = filters.sortOrder || 'ASC';
      switch (filters.sortBy) {
        case 'price':
          query.orderBy('variants.price', order);
          break;
        case 'createdAt':
          query.orderBy('product.createdAt', 'DESC');
          break;
        // Note: popularity sort is commented out because salesCount field doesn't exist
        /*
        case 'popularity':
          query.orderBy('product.salesCount', 'DESC');
          break;
        */
        default:
          query.orderBy('product.createdAt', 'DESC');
      }
    } else {
      query.orderBy('product.createdAt', 'DESC');
    }

    return await query.getMany();
  }

  @Cacheable({ key: 'product', entity: 'product', action: 'detail' })
  async getById(id: number): Promise<Product | null> {
    return await this.repository.findOne({ where: { id }, relations: ['productType', 'variants'] });
  }

  @CacheInvalidate('product')
  async update(id: number, data: Partial<Product>): Promise<Product | null> {
    const product = await this.getById(id);
    if (!product) return null;

    Object.assign(product, data);
    const updatedProduct = await this.repository.save(product);
    
    // Invalidate specific product cache
    await this.cacheService.delete('product', 'detail', { id });
    
    return updatedProduct;
  }

  @CacheInvalidate('product')
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    
    if (result.affected === 1) {
      // Invalidate specific product cache
      await this.cacheService.delete('product', 'detail', { id });
      return true;
    }
    
    return false;
  }

  @Cacheable({ key: 'products', entity: 'product', action: 'paginated' })
  async getAllProducts(
    options: GetAllProductsOptions
  ): Promise<{ products: Product[]; total: number }> {
    const { page, limit, search, category, sort } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (search) {
      queryBuilder.where('product.name ILIKE :search OR product.description ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (sort) {
      const [field, order] = sort.split(':');
      queryBuilder.orderBy(`product.${field}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    const [products, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { products, total };
  }

  @Cacheable({ key: 'product', entity: 'product', action: 'detail' })
  async getProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  @CacheInvalidate('product')
  async createProduct(data: CreateProductData): Promise<Product> {
    const product = this.productRepository.create(data);
    const savedProduct = await this.productRepository.save(product);
    
    // Invalidate product list cache
    await this.cacheService.invalidateAction('product', 'list');
    await this.cacheService.invalidateAction('product', 'paginated');
    
    return savedProduct;
  }

  @CacheInvalidate('product')
  async updateProduct(id: number, data: UpdateProductData): Promise<Product> {
    const product = await this.getProductById(id);
    Object.assign(product, data);
    const updatedProduct = await this.productRepository.save(product);
    
    // Invalidate specific product cache
    await this.cacheService.delete('product', 'detail', { id });
    
    return updatedProduct;
  }

  @CacheInvalidate('product')
  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProductById(id);
    await this.productRepository.remove(product);
    
    // Invalidate specific product cache
    await this.cacheService.delete('product', 'detail', { id });
  }
}
