import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { OfferExpirationService } from '../services/offer-expiration.service';
import { OfferService } from '../services/offer.service';

describe('OfferExpirationService', () => {
  let service: OfferExpirationService;
  let offerService: jest.Mocked<OfferService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockOfferService = {
      expireOffers: jest.fn(),
      getOffersExpiringSoon: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferExpirationService,
        {
          provide: OfferService,
          useValue: mockOfferService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<OfferExpirationService>(OfferExpirationService);
    offerService = module.get(OfferService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleOfferExpiration', () => {
    it('should successfully expire offers and log the count', async () => {
      const expiredCount = 5;
      offerService.expireOffers.mockResolvedValue(expiredCount);

      await service.handleOfferExpiration();

      expect(offerService.expireOffers).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Starting offer expiration cron job...');
      expect(logger.log).toHaveBeenCalledWith(`Successfully expired ${expiredCount} offers`);
    });

    it('should log debug message when no offers to expire', async () => {
      offerService.expireOffers.mockResolvedValue(0);

      await service.handleOfferExpiration();

      expect(offerService.expireOffers).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('No offers to expire at this time');
    });

    it('should handle errors gracefully and log them', async () => {
      const error = new Error('Database connection failed');
      offerService.expireOffers.mockRejectedValue(error);

      await service.handleOfferExpiration();

      expect(logger.error).toHaveBeenCalledWith('Error during offer expiration cron job:', error);
    });
  });

  describe('manuallyExpireOffers', () => {
    it('should call offer service and log the action', async () => {
      const expiredCount = 3;
      offerService.expireOffers.mockResolvedValue(expiredCount);

      const result = await service.manuallyExpireOffers();

      expect(offerService.expireOffers).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Manual offer expiration triggered');
      expect(result).toBe(expiredCount);
    });
  });

  describe('getOffersExpiringSoon', () => {
    it('should call offer service with correct parameters', async () => {
      const mockOffers = [{ id: '1', title: 'Test Offer' }] as any;
      offerService.getOffersExpiringSoon.mockResolvedValue(mockOffers);

      const result = await service.getOffersExpiringSoon();

      expect(offerService.getOffersExpiringSoon).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOffers);
    });
  });
});
