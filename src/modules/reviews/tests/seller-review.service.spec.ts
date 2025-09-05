import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerReviewService } from '../services/seller-review.service';
import { SellerReview } from '../entities/seller-review.entity';
import { User } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../../utils/errors';

describe('SellerReviewService', () => {
  let service: SellerReviewService;
  let reviewRepository: Repository<SellerReview>;
  let userRepository: Repository<User>;
  let offerRepository: Repository<Offer>;

  const mockReviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockOfferRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerReviewService,
        {
          provide: getRepositoryToken(SellerReview),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Offer),
          useValue: mockOfferRepository,
        },
      ],
    }).compile();

    service = module.get<SellerReviewService>(SellerReviewService);
    reviewRepository = module.get<Repository<SellerReview>>(getRepositoryToken(SellerReview));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const mockBuyerId = 'buyer-uuid';
    const mockOfferId = 'offer-uuid';
    const mockSellerId = 'seller-uuid';
    const mockCreateReviewDto = {
      offerId: mockOfferId,
      rating: 5,
      comment: 'Great seller!',
    };

    const mockOffer = {
      id: mockOfferId,
      sellerId: mockSellerId,
      wasPurchased: true,
      buyerRequest: { buyerId: mockBuyerId },
      seller: { id: mockSellerId },
    };

    const mockBuyer = {
      id: mockBuyerId,
      name: 'Test Buyer',
      walletAddress: 'test-wallet',
    };

    const mockReview = {
      id: 'review-uuid',
      offerId: mockOfferId,
      buyerId: mockBuyerId,
      rating: 5,
      comment: 'Great seller!',
      createdAt: new Date(),
    };

    it('should create a review successfully', async () => {
      mockOfferRepository.findOne.mockResolvedValue(mockOffer);
      mockUserRepository.findOne.mockResolvedValue(mockBuyer);
      mockReviewRepository.findOne.mockResolvedValue(null);
      mockReviewRepository.create.mockReturnValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);
      mockUserRepository.update.mockResolvedValue({});

      const result = await service.createReview(mockBuyerId, mockCreateReviewDto);

      expect(mockOfferRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOfferId },
        relations: ['seller', 'buyerRequest'],
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBuyerId },
      });
      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({
        where: { offerId: mockOfferId, buyerId: mockBuyerId },
      });
      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        offerId: mockOfferId,
        buyerId: mockBuyerId,
        rating: 5,
        comment: 'Great seller!',
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundError when offer does not exist', async () => {
      mockOfferRepository.findOne.mockResolvedValue(null);

      await expect(service.createReview(mockBuyerId, mockCreateReviewDto))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when buyer is not the one who made the purchase', async () => {
      const wrongBuyerId = 'wrong-buyer-uuid';
      mockOfferRepository.findOne.mockResolvedValue(mockOffer);

      await expect(service.createReview(wrongBuyerId, mockCreateReviewDto))
        .rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError when offer was not purchased', async () => {
      const unpurchasedOffer = { ...mockOffer, wasPurchased: false };
      mockOfferRepository.findOne.mockResolvedValue(unpurchasedOffer);

      await expect(service.createReview(mockBuyerId, mockCreateReviewDto))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when review already exists', async () => {
      mockOfferRepository.findOne.mockResolvedValue(mockOffer);
      mockUserRepository.findOne.mockResolvedValue(mockBuyer);
      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(service.createReview(mockBuyerId, mockCreateReviewDto))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when rating is out of range', async () => {
      const invalidDto = { ...mockCreateReviewDto, rating: 6 };
      mockOfferRepository.findOne.mockResolvedValue(mockOffer);

      await expect(service.createReview(mockBuyerId, invalidDto))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('getSellerReviews', () => {
    const mockSellerId = 'seller-uuid';
    const mockSeller = {
      id: mockSellerId,
      name: 'Test Seller',
      walletAddress: 'seller-wallet',
      averageSellerRating: 4.5,
      totalSellerReviews: 10,
    };

    const mockReviews = [
      {
        id: 'review-1',
        offerId: 'offer-1',
        buyerId: 'buyer-1',
        rating: 5,
        comment: 'Great!',
        createdAt: new Date(),
        buyer: { id: 'buyer-1', name: 'Buyer 1', walletAddress: 'wallet-1' },
        offer: { id: 'offer-1', title: 'Test Offer', price: 100, sellerId: mockSellerId },
      },
    ];

    it('should return seller reviews successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockSeller);
      mockReviewRepository.find.mockResolvedValue(mockReviews);

      const result = await service.getSellerReviews(mockSellerId);

      expect(result).toHaveProperty('reviews');
      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('totalReviews');
      expect(result).toHaveProperty('seller');
      expect(result.seller.id).toBe(mockSellerId);
    });

    it('should throw NotFoundError when seller does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getSellerReviews(mockSellerId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateReview', () => {
    const mockReviewId = 'review-uuid';
    const mockBuyerId = 'buyer-uuid';
    const mockUpdateData = { rating: 4, comment: 'Updated comment' };

    const mockReview = {
      id: mockReviewId,
      buyerId: mockBuyerId,
      offer: { sellerId: 'seller-uuid' },
      buyer: { id: mockBuyerId, name: 'Buyer', walletAddress: 'wallet' },
    };

    it('should update review successfully', async () => {
      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.save.mockResolvedValue({ ...mockReview, ...mockUpdateData });
      mockUserRepository.update.mockResolvedValue({});

      const result = await service.updateReview(mockReviewId, mockBuyerId, mockUpdateData);

      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        relations: ['buyer', 'offer'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundError when review does not exist', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(service.updateReview(mockReviewId, mockBuyerId, mockUpdateData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when buyer is not the review owner', async () => {
      const wrongBuyerId = 'wrong-buyer-uuid';
      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(service.updateReview(mockReviewId, wrongBuyerId, mockUpdateData))
        .rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteReview', () => {
    const mockReviewId = 'review-uuid';
    const mockBuyerId = 'buyer-uuid';

    const mockReview = {
      id: mockReviewId,
      buyerId: mockBuyerId,
      offer: { sellerId: 'seller-uuid' },
    };

    it('should delete review successfully', async () => {
      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.delete.mockResolvedValue({ affected: 1 });
      mockUserRepository.update.mockResolvedValue({});

      const result = await service.deleteReview(mockReviewId, mockBuyerId);

      expect(result).toBe(true);
      expect(mockReviewRepository.delete).toHaveBeenCalledWith(mockReviewId);
    });

    it('should throw NotFoundError when review does not exist', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteReview(mockReviewId, mockBuyerId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when buyer is not the review owner', async () => {
      const wrongBuyerId = 'wrong-buyer-uuid';
      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(service.deleteReview(mockReviewId, wrongBuyerId))
        .rejects.toThrow(ForbiddenError);
    });
  });
});
