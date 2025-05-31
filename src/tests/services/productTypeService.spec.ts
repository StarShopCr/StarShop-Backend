import { ProductTypeService } from '../../modules/productTypes/services/productTypes.service';
import { ProductType } from '../../modules/productTypes/entities/productTypes.entity';
import { Repository } from 'typeorm';
import AppDataSource from '../../config/ormconfig';

jest.mock('../../config/ormconfig', () => ({
  getRepository: jest.fn(),
}));

describe('ProductTypeService', () => {
  let service: ProductTypeService;
  let mockRepo: jest.Mocked<Repository<ProductType>>;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<ProductType>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    service = new ProductTypeService();
  });

  it('should create a ProductType', async () => {
    const productTypeData = { name: 'Electronics', description: 'Category for electronics' };
    const savedProductType = { id: 1, ...productTypeData, createdAt: new Date(), products: [] };

    mockRepo.create.mockReturnValue(savedProductType);
    mockRepo.save.mockResolvedValue(savedProductType);

    const result = await service.create(productTypeData);

    expect(mockRepo.create).toHaveBeenCalledWith(productTypeData);
    expect(mockRepo.save).toHaveBeenCalledWith(savedProductType);
    expect(result).toEqual(savedProductType);
  });

  it('should get all ProductTypes', async () => {
    const productTypes = [
      {
        id: 1,
        name: 'Electronics',
        description: 'Category for electronics',
        createdAt: new Date(),
        products: [],
      },
    ];
    mockRepo.find.mockResolvedValue(productTypes);

    const result = await service.getAll();

    expect(mockRepo.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(productTypes);
  });

  it('should get a ProductType by ID', async () => {
    const productType = {
      id: 1,
      name: 'Electronics',
      description: 'Category for electronics',
      createdAt: new Date(),
      products: [],
    };
    mockRepo.findOne.mockResolvedValue(productType);

    const result = await service.getById(1);

    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(productType);
  });

  it('should delete a ProductType', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 } as any);

    const result = await service.delete(1);

    expect(mockRepo.delete).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });
});
