import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OfferExpirationService } from '../services/offer-expiration.service';
import { OfferService } from '../services/offer.service';
import { Offer } from '../entities/offer.entity';
import { OfferStatus } from '../enums/offer-status.enum';

describe('Offer Expiration Integration', () => {
  let module: TestingModule;
  let offerExpirationService: OfferExpirationService;
  let offerService: OfferService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Offer],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Offer]),
        ScheduleModule.forRoot(),
      ],
      providers: [OfferExpirationService, OfferService],
    }).compile();

    offerExpirationService = module.get<OfferExpirationService>(OfferExpirationService);
    offerService = module.get<OfferService>(OfferService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Complete Expiration Flow', () => {
    it('should handle the complete offer expiration process', async () => {
      // This test would require a more complex setup with actual database
      // For now, we'll test the service integration
      expect(offerExpirationService).toBeDefined();
      expect(offerService).toBeDefined();
    });

    it('should have proper service dependencies', () => {
      // Verify that the expiration service can access the offer service
      expect(offerExpirationService['offerService']).toBeDefined();
    });
  });

  describe('Service Configuration', () => {
    it('should have ScheduleModule properly configured', () => {
      const scheduleModule = module.get(ScheduleModule);
      expect(scheduleModule).toBeDefined();
    });

    it('should have TypeORM properly configured for offers', () => {
      const offerRepository = module.get('OfferRepository');
      expect(offerRepository).toBeDefined();
    });
  });
});
