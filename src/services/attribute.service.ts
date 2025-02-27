import { Repository } from 'typeorm';
import { Attribute } from '../entities/Attribute';
import AppDataSource from '../config/ormconfig';

export class AttributeService {
  private repository: Repository<Attribute>;

  constructor() {
    this.repository = AppDataSource.getRepository(Attribute);
  }

  //create new attribute
  async create(data: Partial<Attribute>): Promise<Attribute | null> {
    const attribute = this.repository.create(data);
    return await this.repository.save(attribute);
  }

  //get all attributes
  async getAll(): Promise<Attribute[]> {
    return await this.repository.find();
  }

  //get attribute by id
  async getById(id: number): Promise<Attribute | null> {
    return await this.repository.findOne({ where: { id } });
  }

  //update attribute
  async update(id: number, data: Partial<Attribute>): Promise<Attribute | null> {
    const attribute = await this.getById(id);
    if (!attribute) return null;

    Object.assign(attribute, data);
    return await this.repository.save(attribute);
  }

  //delete attribute
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }
}
