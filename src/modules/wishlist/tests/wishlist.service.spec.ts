import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from '../services/wishlist.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistRepository: Repository<Wishlist>;
  let productRepository: Repository<Product>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getRepositoryToken(Wishlist),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    wishlistRepository = module.get<Repository<Wishlist>>(getRepositoryToken(Wishlist));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToWishlist', () => {
    it('should add product to wishlist', async () => {
      const userId = '1';
      const productId = '123';
      const product = new Product();
      product.id = Number(productId);
      const user = new User();
      user.id = Number(userId);

      jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(product);
      jest.spyOn(wishlistRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(wishlistRepository, 'create').mockImplementation((dto) => dto as any);
      jest.spyOn(wishlistRepository, 'save').mockResolvedValueOnce(null);

      await expect(service.addToWishlist(userId, productId)).resolves.toBeUndefined();
    });

    it('should throw ConflictException if product already in wishlist', async () => {
      const userId = '1';
      const productId = '123';
      const product = new Product();
      product.id = Number(productId);

      jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(product);
      jest.spyOn(wishlistRepository, 'findOne').mockResolvedValueOnce(new Wishlist());

      await expect(service.addToWishlist(userId, productId)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if product not found', async () => {
      const userId = '1';
      const productId = '123';

      jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.addToWishlist(userId, productId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '1';
      const productId = '123';
      const product = new Product();
      product.id = Number(productId);

      jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(product);
      jest.spyOn(wishlistRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.addToWishlist(userId, productId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if userId is not a valid number', async () => {
      const invalidUserId = 'abc';
      const productId = '123';

      await expect(service.addToWishlist(invalidUserId, productId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if productId is not a valid number', async () => {
      const userId = '1';
      const invalidProductId = 'xyz';

      await expect(service.addToWishlist(userId, invalidProductId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove product from wishlist', async () => {
      const userId = '1';
      const productId = '123';

      jest.spyOn(wishlistRepository, 'delete').mockResolvedValueOnce({ affected: 1 } as any);

      await expect(service.removeFromWishlist(userId, productId)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if wishlist item not found', async () => {
      const userId = '1';
      const productId = '123';

      jest.spyOn(wishlistRepository, 'delete').mockResolvedValueOnce({ affected: 0 } as any);

      await expect(service.removeFromWishlist(userId, productId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if userId is invalid', async () => {
      const invalidUserId = 'abc';
      const productId = '123';

      await expect(service.removeFromWishlist(invalidUserId, productId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if productId is invalid', async () => {
      const userId = '1';
      const invalidProductId = 'xyz';

      await expect(service.removeFromWishlist(userId, invalidProductId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWishlist', () => {
    it('should return wishlist items', async () => {
      const userId = '1';
      const wishlistItems = [new Wishlist()];

      jest.spyOn(wishlistRepository, 'find').mockResolvedValueOnce(wishlistItems);

      await expect(service.getWishlist(userId)).resolves.toEqual(wishlistItems);
    });

    it('should throw NotFoundException if userId is invalid', async () => {
      const invalidUserId = 'abc';

      await expect(service.getWishlist(invalidUserId)).rejects.toThrow(NotFoundException);
    });
  });
});
