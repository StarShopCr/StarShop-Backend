import { Repository } from 'typeorm';
import { TestEntity } from '../entities/testEntity';
import AppDataSource from '../config/ormconfig';

export class TestService {
  private repo: Repository<TestEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(TestEntity);
  }

  async getEntityByName(name: string): Promise<TestEntity | null> {
    return this.repo.findOneBy({ name });
  }

  async validateEntityExists(name: string): Promise<boolean> {
    const entity = await this.getEntityByName(name);
    return !!entity;
  }
}
