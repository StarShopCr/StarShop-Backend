import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductType } from '../../productTypes/entities/productTypes.entity';
import AppDataSource from '../../../config/ormconfig';

export interface ProductFilters {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
}

export type SortBy = 'price_asc' | 'price_desc' | 'newest' | 'popular';

export class ProductService {
  private repository: Repository<Product>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
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
      return response;
    } catch (error) {
      throw new Error('Database error');
    }
  }

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

  async getById(id: number): Promise<Product | null> {
    return await this.repository.findOne({ where: { id }, relations: ['productType', 'variants'] });
  }

  async update(id: number, data: Partial<Product>): Promise<Product | null> {
    const product = await this.getById(id);
    if (!product) return null;

    Object.assign(product, data);
    return await this.repository.save(product);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }
}
