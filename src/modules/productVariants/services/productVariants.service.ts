import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/productVariants.entity';
import { Product } from '../../products/entities/product.entity';

export class ProductVariantService {
  private productVariantRepository: Repository<ProductVariant>;
  private productRepository: Repository<Product>;

  constructor(
    productVariantRepository: Repository<ProductVariant>,
    productRepository: Repository<Product>
  ) {
    this.productVariantRepository = productVariantRepository;
    this.productRepository = productRepository;
  }

  async create(data: Partial<ProductVariant>, productId: number): Promise<ProductVariant> {
    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    if (!data.sku) {
      throw new Error('SKU is required');
    }

    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    const productVariant = this.productVariantRepository.create({ ...data, product });
    return await this.productVariantRepository.save(productVariant);
  }

  async getAll(): Promise<ProductVariant[]> {
    return await this.productVariantRepository.find({ relations: ['product'] });
  }

  async getById(id: number): Promise<ProductVariant | null> {
    return await this.productVariantRepository.findOne({ where: { id }, relations: ['product'] });
  }

  async update(id: number, data: Partial<ProductVariant>): Promise<ProductVariant | null> {
    const productVariant = await this.getById(id);
    if (!productVariant) return null;

    Object.assign(productVariant, data);
    return await this.productVariantRepository.save(productVariant);
  }

  async updateStockAfterPurchase(id: number, amount: number): Promise<ProductVariant | null> {
    const productVariant = await this.getById(id);
    if (!productVariant) return null;

    if (productVariant.stock < amount) {
      throw new Error('Insufficient stock to complete the purchase');
    }

    productVariant.stock -= amount;
    return await this.productVariantRepository.save(productVariant);
  }

  async restoreAfterOrderCanceled(id: number, amount: number): Promise<boolean> {
    const productVariant = await this.getById(id);
    if (!productVariant) return false;

    productVariant.stock += amount;
    await this.productVariantRepository.save(productVariant);
    return true;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.productVariantRepository.delete(id);
    return result.affected === 1;
  }
}
