import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/ProductVariant';
import { Product } from '../entities/Product';
import AppDataSource from '../config/ormconfig';

export class ProductVariantService {
  private repository: Repository<ProductVariant>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProductVariant);
  }

  /**
   * Create a new ProductVariant
   * @param data Partial data to create a ProductVariant
   * @param productId ID of the associated Product
   * @returns The created ProductVariant
   */
  async create(data: Partial<ProductVariant>, productId: number): Promise<ProductVariant> {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({ where: { id: productId } });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const productVariant = this.repository.create({ ...data, product });
    return await this.repository.save(productVariant);
  }

  /**
   * Retrieve all ProductVariants
   * @returns An array of ProductVariant
   */
  async getAll(): Promise<ProductVariant[]> {
    return await this.repository.find({ relations: ['product'] });
  }

  /**
   * Retrieve a ProductVariant by its ID
   * @param id ID of the ProductVariant
   * @returns The ProductVariant or null if not found
   */
  async getById(id: number): Promise<ProductVariant | null> {
    return await this.repository.findOne({ where: { id }, relations: ['product'] });
  }

  /**
   * Update an existing ProductVariant
   * @param id ID of the ProductVariant to update
   * @param data Partial data to update the ProductVariant
   * @returns The updated ProductVariant or null if not found
   */
  async update(id: number, data: Partial<ProductVariant>): Promise<ProductVariant | null> {
    const productVariant = await this.getById(id);
    if (!productVariant) return null;

    Object.assign(productVariant, data);
    return await this.repository.save(productVariant);
  }

  /**
   * Updates the stock level of a ProductVariant after a purchase.
   *
   * @param id - ID of the ProductVariant to update.
   * @param amount - The number of units purchased.
   * @returns The updated ProductVariant or null if not found or stock is insufficient.
   */
  async updateStockAfterPurchase(id: number, amount: number): Promise<ProductVariant | null> {
    const productVariant = await this.getById(id);
    if (!productVariant) return null;

    if (productVariant.stock < amount) {
      throw new Error('Insufficient stock to complete the purchase');
    }

    productVariant.stock -= amount;
    return await this.repository.save(productVariant);
  }

  /**
   * Restores the stock level of a ProductVariant after an order is canceled.
   *
   * @param id - ID of the ProductVariant to update.
   * @param amount - The number of units to restore.
   * @returns True if the stock was successfully restored, false if the ProductVariant was not found.
   */
  async restoreAfterOrderCanceled(id: number, amount: number): Promise<boolean> {
    const productVariant = await this.getById(id);
    if (!productVariant) return false;

    productVariant.stock += amount;
    await this.repository.save(productVariant);
    return true;
  }

  /**
   * Delete a ProductVariant by its ID
   * @param id ID of the ProductVariant to delete
   * @returns True if deleted, otherwise false
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }
}
