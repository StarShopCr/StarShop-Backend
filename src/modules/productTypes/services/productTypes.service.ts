import { Repository } from 'typeorm';
import { ProductType } from '../entities/productTypes.entity';
import AppDataSource from '../../../config/ormconfig';

export class ProductTypeService {
  private repository: Repository<ProductType>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProductType);
  }

  async create(data: Partial<ProductType>): Promise<ProductType> {
    const productType = this.repository.create(data);
    return await this.repository.save(productType);
  }

  async getAll(): Promise<ProductType[]> {
    return await this.repository.find();
  }

  async getById(id: number): Promise<ProductType | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<ProductType>): Promise<ProductType | null> {
    const productType = await this.getById(id);
    if (!productType) return null;

    Object.assign(productType, data);
    return await this.repository.save(productType);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }
}
