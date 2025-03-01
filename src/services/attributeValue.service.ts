import { Repository } from "typeorm";
import { AttributeValue } from "../entities/AttributeValue";
import { Attribute } from "../entities/Attribute";
import AppDataSource from "../config/ormconfig";

export class AttributeValueService {
  private repository: Repository<AttributeValue>;

  constructor() {
    this.repository = AppDataSource.getRepository(AttributeValue);
  }

  //create new attribute value
  async create(data: {
    value: string;
    attributeId: number;
  }): Promise<AttributeValue | null> {
    const attributeRepo = AppDataSource.getRepository(Attribute);
    const attribute = await attributeRepo.findOne({
      where: { id: data.attributeId },
    });

    if (!attribute) return null;

    const attributeValue = this.repository.create({
      value: data.value,
      attribute,
    });
    return await this.repository.save(attributeValue);
  }

  //get all attribute values
  /**
   * Retrieves a list of attribute values with optional pagination.
   * Includes related attribute data in the result.
   *
   * @param {number} [limit] - The maximum number of attribute values to retrieve.
   * @param {number} [offset] - The number of attribute values to skip before starting to collect results.
   * @returns {Promise<AttributeValue[]>} A promise that resolves to an array of attribute values with their related attributes.
   */
  async getAll(limit?: number, offset?: number): Promise<AttributeValue[]> {
    return await this.repository.find({ 
        skip: offset, 
        take: limit, 
        relations: ["attribute"] 
    });
  }

  //get attribute value by id
  async getById(id: number): Promise<AttributeValue | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["attribute"],
    });
  }

  //update attribute value
  async update(
    id: number,
    data: { value?: string; attributeId?: number }
  ): Promise<AttributeValue | null> {
    const attributeValue = await this.getById(id);
    if (!attributeValue) return null;

    if (data.attributeId) {
      const attributeRepo = AppDataSource.getRepository(Attribute);
      const attribute = await attributeRepo.findOne({
        where: { id: data.attributeId },
      });
      if (attribute) {
        attributeValue.attribute = attribute;
      }
    }

    if (data.value) {
      attributeValue.value = data.value;
    }

    return await this.repository.save(attributeValue);
  }

  //delete attribute value
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }
}
