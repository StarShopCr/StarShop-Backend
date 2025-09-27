import { Test, TestingModule } from '@nestjs/testing';
import { WishlistController } from '../controller/wishlist.controller';
import { WishlistService } from '../services/wishlist.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ConflictException } from '@nestjs/common';
import { Wishlist } from '../entities/wishlist.entity';
import { mockRequest } from '../common/mock/mock-request';
import { AuthRequest } from '../common/types/auth-request.type';
import { Role } from '../../../types/role';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('WishlistController', () => {
  let controller: WishlistController;
  let service: WishlistService;

  const mockWishlistRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    manager: {
      findOneOrFail: jest.fn(),
    },
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        WishlistService,
        {
          provide: getRepositoryToken(Wishlist),
          useValue: mockWishlistRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<WishlistController>(WishlistController);
    service = module.get<WishlistService>(WishlistService);
  });

  describe('addToWishlist', () => {
    it('should call the service method to add product', async () => {
      const userId = 'user-id';
      const productId = 'product-id';
      const req = mockRequest({
        user: {
          id: userId,
          walletAddress: 'test-wallet',
          role: [Role.USER],
        },
      }) as unknown as AuthRequest;

      jest.spyOn(service, 'addToWishlist').mockResolvedValueOnce(undefined);

      await controller.addToWishlist(productId, req);
      expect(service.addToWishlist).toHaveBeenCalledWith(userId, productId);
    });

    it('should throw ConflictException when product is already in wishlist', async () => {
      const userId = 'user-id';
      const productId = 'product-id';
      const req = mockRequest({
        user: {
          id: userId,
          walletAddress: 'test-wallet',
          role: [Role.USER],
        },
      }) as unknown as AuthRequest;

      jest
        .spyOn(service, 'addToWishlist')
        .mockRejectedValueOnce(new ConflictException('Product already in wishlist'));

      await expect(controller.addToWishlist(productId, req)).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFromWishlist', () => {
    it('should call service method to remove product from wishlist', async () => {
      const userId = 'user-id';
      const productId = 'product-id';
      const req = mockRequest({
        user: {
          id: userId,
          walletAddress: 'test-wallet',
          role: [Role.USER],
        },
      }) as unknown as AuthRequest;

      jest.spyOn(service, 'removeFromWishlist').mockResolvedValueOnce(undefined);

      await controller.removeFromWishlist(productId, req);
      expect(service.removeFromWishlist).toHaveBeenCalledWith(userId, productId);
    });
  });

  describe('getWishlist', () => {
    it('should return the user wishlist', async () => {
      const userId = 'user-id';
      const req = mockRequest({
        user: {
          id: userId,
          walletAddress: 'test-wallet',
          role: [Role.USER],
        },
      }) as unknown as AuthRequest;
      const wishlistItems = [new Wishlist()];

      jest.spyOn(service, 'getWishlist').mockResolvedValueOnce(wishlistItems);

      const result = await controller.getWishlist(req);
      expect(result.wishlist).toEqual(wishlistItems);
    });
  });
});
