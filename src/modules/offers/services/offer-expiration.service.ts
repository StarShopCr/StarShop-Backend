import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OfferService } from './offer.service';

@Injectable()
export class OfferExpirationService {
  private readonly logger = new Logger(OfferExpirationService.name);

  constructor(private readonly offerService: OfferService) {}

  /**
   * Cron job that runs every 30 minutes to expire offers
   * This ensures offers are expired in a timely manner without overwhelming the system
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleOfferExpiration(): Promise<void> {
    try {
      this.logger.log('Starting offer expiration cron job...');
      
      const expiredCount = await this.offerService.expireOffers();
      
      if (expiredCount > 0) {
        this.logger.log(`Successfully expired ${expiredCount} offers`);
      } else {
        this.logger.debug('No offers to expire at this time');
      }
    } catch (error) {
      this.logger.error('Error during offer expiration cron job:', error);
    }
  }

  /**
   * Manual trigger for offer expiration (useful for testing)
   */
  async manuallyExpireOffers(): Promise<number> {
    this.logger.log('Manual offer expiration triggered');
    return await this.offerService.expireOffers();
  }

  /**
   * Get offers that are expiring soon (within next hour)
   * Useful for monitoring and debugging
   */
  async getOffersExpiringSoon(): Promise<any[]> {
    return await this.offerService.getOffersExpiringSoon(1);
  }
}
