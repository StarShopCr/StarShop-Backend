import { ProductVariantService } from '../../modules/productVariants/services/productVariants.service';
import { ProductVariant } from '../../modules/productVariants/entities/productVariants.entity';
import { Repository } from 'typeorm';
import AppDataSource from '../../config/ormconfig';
import { ProductType } from '../../modules/productTypes/entities/productTypes.entity';
import { Product } from '../../modules/products/entities/product.entity';

jest.mock('../../config/ormconfig', () => ({
  getRepository: jest.fn(),
}));

describe('ProductVariantService', () => {
  let service: ProductVariantService;
  let mockRepo: jest.Mocked<Repository<ProductVariant>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      findAndCount: jest.fn(),
      manager: {
        transaction: jest.fn(),
      } as any,
    } as unknown as jest.Mocked<Repository<ProductVariant>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    const productVariantRepository = AppDataSource.getRepository(ProductVariant);
    const productRepository = AppDataSource.getRepository(Product);

    service = new ProductVariantService(productVariantRepository, productRepository);
    (service as any).repository = mockRepo;
  });

  it('should create a ProductVariant with Product', async () => {
    const productTypeData = {
      id: 1,
      name: 'Electronics',
      description: 'Category for electronics',
      createdAt: new Date(),
      products: [],
    };
    const productData = {
      id: 1,
      name: 'Laptop',
      description: 'A high-end gaming laptop',
      productType: productTypeData,
      variants: [],
      createdAt: new Date(),
    }; // Product data
    const variantData = { sku: 'LAP123', price: 999.99, stock: 10 };

    const savedVariant = { id: 1, ...variantData, product: productData, createdAt: new Date() };

    const productRepo = { findOne: jest.fn().mockResolvedValue(productData) };
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(productRepo)
      .mockReturnValueOnce(mockRepo);

    mockRepo.create.mockReturnValue(savedVariant);
    mockRepo.save.mockResolvedValue(savedVariant);

    const result = await service.create(variantData, 1);

    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockRepo.create).toHaveBeenCalledWith({ ...variantData, product: productData });
    expect(mockRepo.save).toHaveBeenCalledWith(savedVariant);
    expect(result).toEqual(savedVariant);
  });

  it('should return all ProductVariants', async () => {
    const productData = {
      id: 1,
      name: 'Laptop',
      description: 'A high-end gaming laptop',
      productType: {
        id: 1,
        name: 'Electronics',
        description: 'Category for electronics',
        createdAt: new Date(),
        products: [],
      },
      variants: [],
      createdAt: new Date(),
    };
    const variants = [
      {
        id: 1,
        sku: 'LAP123',
        price: 999.99,
        stock: 10,
        product: productData,
        createdAt: new Date(),
      },
      {
        id: 2,
        sku: 'LAP456',
        price: 899.99,
        stock: 5,
        product: productData,
        createdAt: new Date(),
      },
    ];

    mockRepo.find.mockReturnValue(Promise.resolve(variants));

    const result = await service.getAll();

    expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['product'] });
    expect(result).toEqual(variants);
  });

  it('should return a ProductVariant by ID', async () => {
    const productData = {
      id: 1,
      name: 'Laptop',
      description: 'A high-end gaming laptop',
      productType: {
        id: 1,
        name: 'Electronics',
        description: 'Category for electronics',
        createdAt: new Date(),
        products: [],
      },
      variants: [],
      createdAt: new Date(),
    };
    const variant = {
      id: 1,
      sku: 'LAP123',
      price: 999.99,
      stock: 10,
      product: productData,
      createdAt: new Date(),
    };

    mockRepo.findOne.mockResolvedValue(variant);

    const result = await service.getById(1);

    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['product'] });
    expect(result).toEqual(variant);
  });

  it('should update a ProductVariant', async () => {
    const productData = {
      id: 1,
      name: 'Laptop',
      description: 'A high-end gaming laptop',
      productType: {
        id: 1,
        name: 'Electronics',
        description: 'Category for electronics',
        createdAt: new Date(),
        products: [],
      },
      variants: [],
      createdAt: new Date(),
    };
    const variant = {
      id: 1,
      sku: 'LAP123',
      price: 999.99,
      stock: 10,
      product: productData,
      createdAt: new Date(),
    };
    const updatedData = { price: 899.99, stock: 15 };
    const updatedVariant = { ...variant, ...updatedData };

    mockRepo.findOne.mockResolvedValue(variant);
    mockRepo.save.mockResolvedValue(updatedVariant);

    const result = await service.update(1, updatedData);

    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['product'] });
    expect(mockRepo.save).toHaveBeenCalledWith(updatedVariant);
    expect(result).toEqual(updatedVariant);
  });

  it('should delete a ProductVariant', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 } as any);

    const result = await service.delete(1);
    expect(mockRepo.delete).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  // Added Tests
  it('should throw an error when creating a variant with missing SKU', async () => {
    const variantData = { price: 999.99, stock: 10 }; // No SKU
    const productData = {
      id: 1,
      name: 'Laptop',
      description: 'A high-end gaming laptop',
      productType: {
        id: 1,
        name: 'Electronics',
        description: 'Category for electronics',
        createdAt: new Date(),
        products: [],
      },
      variants: [],
      createdAt: new Date(),
    };

    const productRepo = { findOne: jest.fn().mockResolvedValue(productData) };
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(productRepo)
      .mockReturnValueOnce(mockRepo);

    await expect(service.create(variantData, 1)).rejects.toThrow('SKU is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should throw an error when product does not exist', async () => {
    const variantData = { sku: 'LAP123', price: 999.99, stock: 10 };

    const productRepo = { findOne: jest.fn().mockResolvedValue(null) }; // No product found
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(productRepo)
      .mockReturnValueOnce(mockRepo);

    await expect(service.create(variantData, 1)).rejects.toThrow('Product with ID 1 not found');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw an error for negative price', async () => {
    const variantData = { sku: 'LAP123', price: -999.99, stock: 10 };
    const productData = {
      id: 1,
      name: 'Laptop',
      description: 'A high-end gaming laptop',
      productType: {
        id: 1,
        name: 'Electronics',
        description: 'Category for electronics',
        createdAt: new Date(),
        products: [],
      },
      variants: [],
      createdAt: new Date(),
    };

    const productRepo = { findOne: jest.fn().mockResolvedValue(productData) };
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(productRepo)
      .mockReturnValueOnce(mockRepo);

    await expect(service.create(variantData, 1)).rejects.toThrow('Price cannot be negative');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should return null when updating a non-existent variant', async () => {
    const updatedData = { price: 899.99 };

    mockRepo.findOne.mockResolvedValue(null); // Variant not found

    const result = await service.update(1, updatedData);

    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['product'] });
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should handle repository save failure during update', async () => {
    const productData = {
      id: 1,
      name: 'Laptop',
      description: 'A high-end gaming laptop',
      productType: {
        id: 1,
        name: 'Electronics',
        description: 'Category for electronics',
        createdAt: new Date(),
        products: [],
      },
      variants: [],
      createdAt: new Date(),
    };
    const variant = {
      id: 1,
      sku: 'LAP123',
      price: 999.99,
      stock: 10,
      product: productData,
      createdAt: new Date(),
    };
    const updatedData = { price: 899.99 };

    mockRepo.findOne.mockResolvedValue(variant);
    mockRepo.save.mockRejectedValue(new Error('Database error'));

    await expect(service.update(1, updatedData)).rejects.toThrow('Database error');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should return false when deleting a non-existent variant', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 0 } as any);

    const result = await service.delete(1);

    expect(mockRepo.delete).toHaveBeenCalledWith(1);
    expect(result).toBe(false);
  });
});
