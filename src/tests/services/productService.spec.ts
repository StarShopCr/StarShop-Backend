import { ProductService } from '../../modules/products/services/product.service';
import { Product } from '../../modules/products/entities/product.entity';
import { Repository } from 'typeorm';
import { ProductType } from '../../modules/productTypes/entities/productTypes.entity';
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

  // Added Tests
  it('should throw an error when creating a product with missing name', async () => {
    const productData = { description: 'Gaming Laptop' }; // No name
    const productType = {
      id: 1,
      name: 'Electronics',
      description: 'Category for electronics',
      createdAt: new Date(),
      products: [],
    };

    const productTypeRepo = { findOne: jest.fn().mockResolvedValue(productType) };
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(productTypeRepo)
      .mockReturnValueOnce(mockRepo);

    await expect(service.create(productData, 1)).rejects.toThrow('Name is required');
    expect(mockRepo.create).not.toHaveBeenCalled(); // Shouldn't reach create
  });

  it('should throw an error when productType does not exist', async () => {
    const productData = { name: 'Laptop', description: 'Gaming Laptop' };

    const productTypeRepo = { findOne: jest.fn().mockResolvedValue(null) }; // No productType found
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(productTypeRepo)
      .mockReturnValueOnce(mockRepo);

    await expect(service.create(productData, 1)).rejects.toThrow('ProductType with id 1 not found');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should handle repository save failure', async () => {
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
      .mockReturnValueOnce(productTypeRepo) // For ProductType
      .mockReturnValueOnce(mockRepo); // For Product

    mockRepo.create.mockReturnValue(savedProduct);
    mockRepo.save.mockRejectedValue(new Error('Database error'));

    await expect(service.create(productData, 1)).rejects.toThrow('Database error');
    expect(mockRepo.create).toHaveBeenCalledWith({ ...productData, productType });
  });
});
