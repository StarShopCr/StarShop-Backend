import { Repository } from 'typeorm';
import { Attribute } from '../entities/Attribute';
import AppDataSource from '../config/ormconfig';

export class AttributeService {
  private repository: Repository<Attribute>;

  constructor() {
    this.repository = AppDataSource.getRepository(Attribute);
  }

  // Create new attribute with duplicate check
  async create(data: Partial<Attribute>): Promise<Attribute> {
    // Check if an attribute with the same name already exists
    const existingAttribute = await this.repository.findOne({
      where: { name: data.name },
    });

    if (existingAttribute) {
      throw new Error(`Attribute with name '${data.name}' already exists.`);
    }

    // Create and save the new attribute
    const attribute = this.repository.create(data);
    return await this.repository.save(attribute);
  }

  //get all attributes

  /**
   * Retrieves a list of attributes with optional pagination.
   *
   * @param {number} [limit] - The maximum number of attributes to retrieve.
   * @param {number} [offset] - The number of attributes to skip before starting to collect results.
   * @returns {Promise<Attribute[]>} A promise that resolves to an array of attributes.
   */
  async getAll(limit?: number, offset?: number): Promise<Attribute[]> {
    return await this.repository.find({
      skip: offset,
      take: limit,
    });
  }

  //get attribute by id
  async getById(id: number): Promise<Attribute | null> {
    return await this.repository.findOne({ where: { id } });
  }

  // Update attribute with duplicate check
  async update(id: number, data: Partial<Attribute>): Promise<Attribute | null> {
    const attribute = await this.getById(id);
    if (!attribute) return null;

    // Check if another attribute with the same name exists
    if (data.name) {
      const existingAttribute = await this.repository.findOne({
        where: { name: data.name },
      });

      if (existingAttribute && existingAttribute.id !== id) {
        throw new Error(`Another attribute with name '${data.name}' already exists.`);
      }
    }

    Object.assign(attribute, data);
    return await this.repository.save(attribute);
  }

  // Delete attribute
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }
}
