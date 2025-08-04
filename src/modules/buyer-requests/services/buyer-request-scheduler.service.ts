import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { BuyerRequest, BuyerRequestStatus } from '../entities/buyer-request.entity';

@Injectable()
export class BuyerRequestSchedulerService {
  private readonly logger = new Logger(BuyerRequestSchedulerService.name);

  constructor(
    @InjectRepository(BuyerRequest)
    private readonly buyerRequestRepository: Repository<BuyerRequest>
  ) {}

  /**
   * Runs every 10 minutes to check and close expired buyer requests
   */
  @Cron('0 */10 * * * *') // Every 10 minutes
  async handleExpiredRequests(): Promise<void> {
    this.logger.log('Starting to check for expired buyer requests...');

    try {
      // Find all open requests that have expired
      const expiredRequests = await this.buyerRequestRepository.find({
        where: {
          status: BuyerRequestStatus.OPEN,
          expiresAt: LessThan(new Date()),
        },
      });

      if (expiredRequests.length === 0) {
        this.logger.log('No expired buyer requests found');
        return;
      }

      // Update all expired requests to closed status
      const updateResult = await this.buyerRequestRepository.update(
        {
          status: BuyerRequestStatus.OPEN,
          expiresAt: LessThan(new Date()),
        },
        { status: BuyerRequestStatus.CLOSED }
      );

      this.logger.log(`Successfully closed ${updateResult.affected || 0} expired buyer requests`);

      // Log details of closed requests for debugging
      expiredRequests.forEach((request) => {
        this.logger.debug(
          `Closed expired request: ID ${request.id}, expired at ${request.expiresAt}`
        );
      });
    } catch (error) {
      this.logger.error('Failed to close expired buyer requests', error.stack);
    }
  }

  /**
   * Manual method to close expired requests (can be called on app start)
   */
  async closeExpiredRequests(): Promise<number> {
    this.logger.log('Manually closing expired buyer requests...');

    try {
      const result = await this.buyerRequestRepository.update(
        {
          status: BuyerRequestStatus.OPEN,
          expiresAt: LessThan(new Date()),
        },
        { status: BuyerRequestStatus.CLOSED }
      );

      const closedCount = result.affected || 0;
      this.logger.log(`Manually closed ${closedCount} expired buyer requests`);

      return closedCount;
    } catch (error) {
      this.logger.error('Failed to manually close expired buyer requests', error.stack);
      throw error;
    }
  }
}
