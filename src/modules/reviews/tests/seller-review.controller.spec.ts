import { Test, TestingModule } from '@nestjs/testing';
import { SellerReviewController } from '../controllers/seller-review.controller';
import { SellerReviewService } from '../services/seller-review.service';
import { CreateSellerReviewDTO, UpdateSellerReviewDTO } from '../dto/seller-review.dto';
import { BadRequestException } from '@nestjs/common';

describe('SellerReviewController', () => {
  let controller: SellerReviewController;
  let service: SellerReviewService;

  const mockSellerReviewService = {
    createReview: jest.fn(),
    getSellerReviews: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerReviewController],
      providers: [
        {
          provide: SellerReviewService,
          useValue: mockSellerReviewService,
        },
      ],
    }).compile();

    controller = module.get<SellerReviewController>(SellerReviewController);
    service = module.get<SellerReviewService>(SellerReviewService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const mockCreateReviewDto: CreateSellerReviewDTO = {
      offerId: 'offer-uuid',
      rating: 5,
      comment: 'Great seller!',
    };

    const mockUser = { id: 'buyer-uuid' };
    const mockRequest = { user: mockUser };

    const mockReview = {
      id: 'review-uuid',
      offerId: 'offer-uuid',
      buyerId: 'buyer-uuid',
      rating: 5,
      comment: 'Great seller!',
      createdAt: new Date(),
    };

    it('should create a review successfully', async () => {
      mockSellerReviewService.createReview.mockResolvedValue(mockReview);

      const result = await controller.createReview(mockCreateReviewDto, mockRequest as any);

      expect(service.createReview).toHaveBeenCalledWith('buyer-uuid', mockCreateReviewDto);
      expect(result).toEqual(mockReview);
    });

    it('should throw BadRequestException when user ID is missing', async () => {
      const mockRequestWithoutUser = { user: null };

      await expect(controller.createReview(mockCreateReviewDto, mockRequestWithoutUser as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getSellerReviews', () => {
    const mockSellerId = 'seller-uuid';
    const mockReviewsData = {
      reviews: [
        {
          id: 'review-uuid',
          offerId: 'offer-uuid',
          buyerId: 'buyer-uuid',
          rating: 5,
          comment: 'Great seller!',
          createdAt: new Date(),
        },
      ],
      averageRating: 5,
      totalReviews: 1,
      seller: {
        id: 'seller-uuid',
        name: 'Test Seller',
        walletAddress: 'seller-wallet',
        averageSellerRating: 5,
        totalSellerReviews: 1,
      },
    };

    it('should return seller reviews successfully', async () => {
      mockSellerReviewService.getSellerReviews.mockResolvedValue(mockReviewsData);

      const result = await controller.getSellerReviews(mockSellerId);

      expect(service.getSellerReviews).toHaveBeenCalledWith(mockSellerId);
      expect(result).toEqual(mockReviewsData);
    });

    it('should throw BadRequestException when seller ID is missing', async () => {
      await expect(controller.getSellerReviews(''))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateReview', () => {
    const mockReviewId = 'review-uuid';
    const mockUpdateData: UpdateSellerReviewDTO = {
      rating: 4,
      comment: 'Updated comment',
    };

    const mockUser = { id: 'buyer-uuid' };
    const mockRequest = { user: mockUser };

    const mockUpdatedReview = {
      id: 'review-uuid',
      offerId: 'offer-uuid',
      buyerId: 'buyer-uuid',
      rating: 4,
      comment: 'Updated comment',
      createdAt: new Date(),
    };

    it('should update review successfully', async () => {
      mockSellerReviewService.updateReview.mockResolvedValue(mockUpdatedReview);

      const result = await controller.updateReview(mockReviewId, mockUpdateData, mockRequest as any);

      expect(service.updateReview).toHaveBeenCalledWith(mockReviewId, 'buyer-uuid', mockUpdateData);
      expect(result).toEqual(mockUpdatedReview);
    });

    it('should throw BadRequestException when user ID is missing', async () => {
      const mockRequestWithoutUser = { user: null };

      await expect(controller.updateReview(mockReviewId, mockUpdateData, mockRequestWithoutUser as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when review ID is missing', async () => {
      await expect(controller.updateReview('', mockUpdateData, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteReview', () => {
    const mockReviewId = 'review-uuid';
    const mockUser = { id: 'buyer-uuid' };
    const mockRequest = { user: mockUser };

    it('should delete review successfully', async () => {
      mockSellerReviewService.deleteReview.mockResolvedValue(true);

      const result = await controller.deleteReview(mockReviewId, mockRequest as any);

      expect(service.deleteReview).toHaveBeenCalledWith(mockReviewId, 'buyer-uuid');
      expect(result).toBe(true);
    });

    it('should throw BadRequestException when user ID is missing', async () => {
      const mockRequestWithoutUser = { user: null };

      await expect(controller.deleteReview(mockReviewId, mockRequestWithoutUser as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when review ID is missing', async () => {
      await expect(controller.deleteReview('', mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });
});
