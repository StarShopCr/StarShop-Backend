import { Repository } from 'typeorm';
import AppDataSource from '../../config/ormconfig';
import { TestService } from '../../services/test.service';
import { TestEntity } from '../../entities/testEntity';

jest.mock('../../config/ormconfig', () => ({
  getRepository: jest.fn(),
}));

describe('TestService', () => {
  let service: TestService;
  let mockRepo: jest.Mocked<Repository<TestEntity>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<TestEntity>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    service = new TestService();
  });

  it('should return true if the entity exists', async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Existing Entity' } as TestEntity);

    const result = await service.validateEntityExists('Existing Entity');
    expect(result).toBe(true);
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ name: 'Existing Entity' });
  });

  it('should return false if the entity does not exist', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    const result = await service.validateEntityExists('Nonexistent Entity');
    expect(result).toBe(false);
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ name: 'Nonexistent Entity' });
  });

  it('should retrieve an entity by name', async () => {
    const entity = { id: 1, name: 'Existing Entity' } as TestEntity;
    mockRepo.findOneBy.mockResolvedValue(entity);

    const result = await service.getEntityByName('Existing Entity');
    expect(result).toEqual(entity);
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ name: 'Existing Entity' });
  });
});
