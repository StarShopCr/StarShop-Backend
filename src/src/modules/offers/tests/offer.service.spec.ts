import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { OffersService } from '../services/offers.service';
import { Offer } from '../entities/offer.entity';
import { OfferStatus } from '../enums/offer-status.enum';
import {
  BuyerRequest,
  BuyerRequestStatus,
} from '../../buyer-requests/entities/buyer-request.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';

describe('OffersService', () => {
  let service: OffersService;
  let offerRepository: jest.Mocked<Repository<Offer>>;
  let buyerRequestRepository: jest.Mocked<Repository<BuyerRequest>>;

  const mockSellerId = 1;
  const mockBuyerId = 1;
  const mockBuyerRequestId = 123;
  const mockOfferId = 'offer-uuid-1';

  const mockOpenBuyerRequest = {
    id: mockBuyerRequestId,
    title: 'Test Request',
    description: 'Test Description',
    budgetMin: 100,
    budgetMax: 200,
    categoryId: 1,
    userId: mockBuyerId,
    status: BuyerRequestStatus.OPEN,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BuyerRequest;

  const mockClosedBuyerRequest = {
    id: mockBuyerRequestId,
    title: 'Test Request',
    description: 'Test Description',
    budgetMin: 100,
    budgetMax: 200,
    categoryId: 1,
    userId: mockBuyerId,
    status: BuyerRequestStatus.CLOSED,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BuyerRequest;

  const createMockPendingOffer = () =>
    ({
      id: mockOfferId,
      title: 'Test Offer',
      description: 'Test Description',
      price: 150,
      deliveryDays: 7,
      sellerId: mockSellerId,
      status: OfferStatus.PENDING,
      buyerRequestId: mockBuyerRequestId,
      buyerRequest: mockOpenBuyerRequest,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as Offer;

  const mockPendingOffer = createMockPendingOffer();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        {
          provide: getRepositoryToken(Offer),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BuyerRequest),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
    offerRepository = module.get(getRepositoryToken(Offer));
    buyerRequestRepository = module.get(getRepositoryToken(BuyerRequest));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createOfferDto: CreateOfferDto = {
      buyerRequestId: mockBuyerRequestId,
      title: 'A Great Offer',
      description: 'This is a detailed description.',
      price: 150.0,
      deliveryDays: 5,
    };

    it('should create an offer successfully', async () => {
      buyerRequestRepository.findOne.mockResolvedValue(mockOpenBuyerRequest);
      offerRepository.findOne.mockResolvedValue(null);
      offerRepository.create.mockReturnValue(mockPendingOffer);
      offerRepository.save.mockResolvedValue(mockPendingOffer);

      const result = await service.create(createOfferDto, mockSellerId);

      expect(result).toEqual(mockPendingOffer);
      expect(buyerRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBuyerRequestId },
      });
      expect(offerRepository.create).toHaveBeenCalledWith({
        ...createOfferDto,
        sellerId: mockSellerId,
      });
      expect(offerRepository.save).toHaveBeenCalledWith(mockPendingOffer);
    });
  });

  describe('accept', () => {
    it('should accept an offer and reject others sequentially', async () => {
      // 1. Mock the findOne call for the offer being accepted
      offerRepository.findOne.mockResolvedValueOnce(mockPendingOffer);
      // 2. Mock the findOne call that checks for other already-accepted offers
      offerRepository.findOne.mockResolvedValueOnce(null);
      // 3. Mock the save call for the offer that is now accepted
      offerRepository.save.mockResolvedValue({ ...mockPendingOffer, status: OfferStatus.ACCEPTED });
      // 4. Mock the update call for rejecting other offers
      offerRepository.update.mockResolvedValue(undefined);

      const result = await service.accept(mockOfferId, String(mockBuyerId));

      expect(offerRepository.findOne).toHaveBeenCalledTimes(2);
      expect(offerRepository.save).toHaveBeenCalledWith({
        ...mockPendingOffer,
        status: OfferStatus.ACCEPTED,
      });
      expect(offerRepository.update).toHaveBeenCalledWith(
        { buyerRequestId: mockBuyerRequestId, status: OfferStatus.PENDING },
        { status: OfferStatus.REJECTED }
      );
      expect(result.status).toBe(OfferStatus.ACCEPTED);
    });

    it('should throw ForbiddenException if user is not the buyer', async () => {
      const wrongBuyerId = 'wrong-buyer-id-99';
      offerRepository.findOne.mockResolvedValue(mockPendingOffer);
      await expect(service.accept(mockOfferId, wrongBuyerId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if another offer is already accepted', async () => {
      offerRepository.findOne.mockResolvedValueOnce(mockPendingOffer);
      await expect(service.accept(mockOfferId, String(mockBuyerId))).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reject', () => {
    it('should reject a pending offer successfully', async () => {
      offerRepository.findOne.mockResolvedValue(mockPendingOffer);
      offerRepository.save.mockResolvedValue({ ...mockPendingOffer, status: OfferStatus.REJECTED });

      const result = await service.reject(mockOfferId, String(mockBuyerId));

      expect(result.status).toBe(OfferStatus.REJECTED);
      expect(offerRepository.save).toHaveBeenCalledWith({
        ...mockPendingOffer,
        status: OfferStatus.REJECTED,
      });
    });

    it('should throw ForbiddenException if user is not the buyer', async () => {
      const wrongBuyerId = 'wrong-buyer-id-99';
      offerRepository.findOne.mockResolvedValue(mockPendingOffer);
      await expect(service.reject(mockOfferId, wrongBuyerId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if offer is not pending', async () => {
      const acceptedOffer = { ...mockPendingOffer, status: OfferStatus.ACCEPTED };
      offerRepository.findOne.mockResolvedValue(acceptedOffer);
      await expect(service.reject(mockOfferId, String(mockBuyerId))).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
