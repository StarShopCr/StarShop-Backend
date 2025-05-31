import AppDataSource from '../../../config/ormconfig';
import { ProductVariant } from '../../../modules/productVariants/entities/productVariants.entity';
import { Product } from '../../../modules/products/entities/product.entity';
import { ProductVariantService } from '../../../modules/productVariants/services/productVariants.service';

describe('ProductVariantService Integration Tests', () => {
  let service: ProductVariantService;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.synchronize(true);

    const productVariantRepository = AppDataSource.getRepository(ProductVariant);
    const productRepository = AppDataSource.getRepository(Product);

    service = new ProductVariantService(productVariantRepository, productRepository);
  });

  afterEach(async () => {
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('should create a ProductVariant with Product', async () => {
    const productRepo = AppDataSource.getRepository(Product);

    const product = productRepo.create({
      name: 'Laptop',
      description: 'High-end gaming laptop',
    });
    const savedProduct = await productRepo.save(product);

    const variantData = { sku: 'LAP123', price: 999.99, stock: 10 };
    const variant = await service.create(variantData, savedProduct.id);

    expect(variant).toBeDefined();
    expect(variant.id).toBeDefined();
    expect(variant.sku).toBe('LAP123');
    expect(variant.product).toEqual(
      expect.objectContaining({
        id: savedProduct.id,
        name: 'Laptop',
      })
    );
  });

  it('should fetch all ProductVariants with their Products', async () => {
    const productRepo = AppDataSource.getRepository(Product);
    const product = productRepo.create({ name: 'Laptop' });
    const savedProduct = await productRepo.save(product);

    const variantRepo = AppDataSource.getRepository(ProductVariant);
    const variant1 = variantRepo.create({
      sku: 'LAP123',
      price: 999.99,
      stock: 10,
      product: savedProduct,
    });
    const variant2 = variantRepo.create({
      sku: 'LAP456',
      price: 899.99,
      stock: 5,
      product: savedProduct,
    });

    await variantRepo.save([variant1, variant2]);

    const variants = await service.getAll();

    expect(variants).toBeDefined();
    expect(variants).toHaveLength(2);
    expect(variants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sku: 'LAP123' }),
        expect.objectContaining({ sku: 'LAP456' }),
      ])
    );
  });

  it('should delete a ProductVariant', async () => {
    const productRepo = AppDataSource.getRepository(Product);
    const product = productRepo.create({ name: 'Laptop' });
    const savedProduct = await productRepo.save(product);

    const variantRepo = AppDataSource.getRepository(ProductVariant);
    const variant = variantRepo.create({
      sku: 'LAP123',
      price: 999.99,
      stock: 10,
      product: savedProduct,
    });
    const savedVariant = await variantRepo.save(variant);

    const deleted = await service.delete(savedVariant.id);

    expect(deleted).toBe(true);

    const foundVariant = await variantRepo.findOne({ where: { id: savedVariant.id } });
    expect(foundVariant).toBeNull();
  });
});
