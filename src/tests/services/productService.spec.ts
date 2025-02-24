import { ProductService } from '../../services/product.service';
import { Product } from '../../entities/Product';
import { Repository } from 'typeorm';
import { ProductType } from '../../entities/ProductType';
import AppDataSource from '../../config/ormconfig';

jest.mock('../../config/ormconfig', () => ({
  getRepository: jest.fn(),
}));

describe('ProductService', () => {
  let service: ProductService;
  let mockRepo: jest.Mocked<Repository<Product>>;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    service = new ProductService();
  });

  it('should create a Product with ProductType', async () => {
    const productData = { name: 'Laptop', description: 'Gaming Laptop' };
    const productType = {
      id: 1,
      name: 'Electronics',
      description: 'Category for electronics',
      createdAt: new Date(),
      products: [],
    };
    const savedProduct = {
      id: 1,
      ...productData,
      productType,
      variants: [],
      createdAt: new Date(),
    };

    const productTypeRepo = { findOne: jest.fn().mockResolvedValue(productType) };
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(productTypeRepo)
      .mockReturnValueOnce(mockRepo);

    mockRepo.create.mockReturnValue(savedProduct);
    mockRepo.save.mockResolvedValue(savedProduct);

    const result = await service.create(productData, 1);

    expect(productTypeRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockRepo.create).toHaveBeenCalledWith({ ...productData, productType });
    expect(result).toEqual(savedProduct);
  });
});
