import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OfferService } from '../services/offer.service';
import { Offer } from '../entities/offer.entity';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { Product } from '../../products/entities/product.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { OfferStatus } from '../enums/offer-status.enum';

describe('OfferService - Expiration Features', () => {
  let service: OfferService;
  let offerRepository: jest.Mocked<Repository<Offer>>;
  let notificationService: jest.Mocked<NotificationService>;

  const mockOffer = {
    id: 'offer-1',
    title: 'Test Offer',
    status: OfferStatus.PENDING,
    expiresAt: new Date('2024-01-01T00:00:00Z'),
    sellerId: 1,
    buyerRequestId: 1,
  } as any;

  beforeEach(async () => {
    const mockOfferRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    const mockNotificationService = {
      sendNotificationToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferService,
        {
          provide: getRepositoryToken(Offer),
          useValue: mockOfferRepository,
        },
        {
          provide: getRepositoryToken(BuyerRequest),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<OfferService>(OfferService);
    offerRepository = module.get(getRepositoryToken(Offer));
    notificationService = module.get(NotificationService);
  });

  describe('expireOffers', () => {
    it('should expire pending offers that have passed expiration date', async () => {
      const now = new Date();
      const expiredOffers = [mockOffer] as any;
      
      offerRepository.find.mockResolvedValue(expiredOffers);
      offerRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.expireOffers();

      expect(offerRepository.find).toHaveBeenCalledWith({
        where: {
          status: OfferStatus.PENDING,
          expiresAt: LessThan(now),
        },
      });

      expect(offerRepository.update).toHaveBeenCalledWith(
        {
          status: OfferStatus.PENDING,
          expiresAt: LessThan(now),
        },
        {
          status: OfferStatus.REJECTED,
          updatedAt: now,
        }
      );

      expect(notificationService.sendNotificationToUser).toHaveBeenCalledWith({
        userId: '1',
        title: 'Offer Expired',
        message: 'Your offer "Test Offer" has expired and was automatically rejected.',
        payload: {
          offerId: 'offer-1',
          requestId: 1,
          reason: 'expired',
        },
        type: 'offer',
      });

      expect(result).toBe(1);
    });

    it('should return 0 when no offers to expire', async () => {
      offerRepository.find.mockResolvedValue([] as any);

      const result = await service.expireOffers();

      expect(result).toBe(0);
      expect(offerRepository.update).not.toHaveBeenCalled();
      expect(notificationService.sendNotificationToUser).not.toHaveBeenCalled();
    });

    it('should handle multiple expired offers correctly', async () => {
      const multipleExpiredOffers = [
        { ...mockOffer, id: 'offer-1', sellerId: 1 },
        { ...mockOffer, id: 'offer-2', sellerId: 2 },
      ] as any;
      
      offerRepository.find.mockResolvedValue(multipleExpiredOffers);
      offerRepository.update.mockResolvedValue({ affected: 2 } as any);

      const result = await service.expireOffers();

      expect(result).toBe(2);
      expect(notificationService.sendNotificationToUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('getOffersExpiringSoon', () => {
    it('should return offers expiring within specified hours', async () => {
      const expiringOffers = [mockOffer] as any;
      offerRepository.find.mockResolvedValue(expiringOffers);

      const result = await service.getOffersExpiringSoon(2);

      expect(offerRepository.find).toHaveBeenCalledWith({
        where: {
          status: OfferStatus.PENDING,
          expiresAt: LessThan(expect.any(Date)),
        },
      });
      expect(result).toEqual(expiringOffers);
    });
  });

  describe('isOfferExpired', () => {
    it('should return true for expired pending offer', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const expiredOffer = {
        expiresAt: pastDate,
        status: OfferStatus.PENDING,
      };

      offerRepository.findOne.mockResolvedValue(expiredOffer as any);

      const result = await service.isOfferExpired('offer-1');

      expect(result).toBe(true);
    });

    it('should return false for non-expired pending offer', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const validOffer = {
        expiresAt: futureDate,
        status: OfferStatus.PENDING,
      };

      offerRepository.findOne.mockResolvedValue(validOffer as any);

      const result = await service.isOfferExpired('offer-1');

      expect(result).toBe(false);
    });

    it('should return false for accepted offer regardless of expiration', async () => {
      const expiredAcceptedOffer = {
        expiresAt: new Date('2024-01-01T00:00:00Z'),
        status: OfferStatus.ACCEPTED,
      };

      offerRepository.findOne.mockResolvedValue(expiredAcceptedOffer as any);

      const result = await service.isOfferExpired('offer-1');

      expect(result).toBe(false);
    });

    it('should throw NotFoundException for non-existent offer', async () => {
      offerRepository.findOne.mockResolvedValue(null);

      await expect(service.isOfferExpired('non-existent')).rejects.toThrow('Offer not found');
    });
  });
});
