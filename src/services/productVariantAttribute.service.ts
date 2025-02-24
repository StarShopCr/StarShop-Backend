import { Repository } from 'typeorm';
import { ProductVariantAttribute } from '../entities/ProductVariantAttribute';
import { ProductVariant } from '../entities/ProductVariant';
import { AttributeValue } from '../entities/AttributeValue';
import AppDataSource from '../config/ormconfig';

export class ProductVariantAttributeService {
  private repository: Repository<ProductVariantAttribute>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProductVariantAttribute);
  }

  //create new product variant attribute
  async create(data: {
    productvariantId: number;
    attributeValueId: number;
  }): Promise<ProductVariantAttribute | null> {
    const productVariantRepo = AppDataSource.getRepository(ProductVariant);
    const attributeValueRepo = AppDataSource.getRepository(AttributeValue);

    const productVariant = await productVariantRepo.findOne({
      where: { id: data.productvariantId },
    });
    const attributeValue = await attributeValueRepo.findOne({
      where: { id: data.attributeValueId },
    });

    if (!productVariant || !attributeValue) return null;

    const productVariantAttribute = this.repository.create({
      productVariant,
      attributeValue,
    });

    return await this.repository.save(productVariantAttribute);
  }

  //get all product variant attributes
  async getAll(): Promise<ProductVariantAttribute[]> {
    return await this.repository.find({
      relations: ['productVariant', 'attributeValue'],
    });
  }

  //get product variant attribute by id
  async getById(id: number): Promise<ProductVariantAttribute | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['productVariant', 'attributeValue'],
    });
  }

  //update product variant attribute
  async update(
    id: number,
    data: { productVariantId?: number; attributeValueId?: number }
  ): Promise<ProductVariantAttribute | null> {
    const productVariantAttribute = await this.getById(id);
    if (!productVariantAttribute) return null;

    if (data.productVariantId) {
      const productVariantRepo = AppDataSource.getRepository(ProductVariant);
      const productVariant = await productVariantRepo.findOne({
        where: { id: data.productVariantId },
      });
      if (productVariant) {
        productVariantAttribute.productVariant = productVariant;
      }
    }

    if (data.attributeValueId) {
      const attributeValueRepo = AppDataSource.getRepository(AttributeValue);
      const attributeValue = await attributeValueRepo.findOne({
        where: { id: data.attributeValueId },
      });
      if (attributeValue) {
        productVariantAttribute.attributeValue = attributeValue;
      }
    }

    return await this.repository.save(productVariantAttribute);
  }

  //delete product variant attribute
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }
}
