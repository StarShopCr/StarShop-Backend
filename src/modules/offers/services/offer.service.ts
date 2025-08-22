import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';

import { Offer } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { Product } from '@/modules/products/entities/product.entity';
import { OfferStatus } from '../enums/offer-status.enum';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,

    @InjectRepository(BuyerRequest)
    private readonly buyerRequestRepository: Repository<BuyerRequest>,

    @InjectRepository(Product)
    private readonly ProductRepository: Repository<Product>,

    private readonly notificationService: NotificationService
  ) {}

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const { buyerRequestId, title, description, price, productId } = createOfferDto;

    const buyerRequest = await this.buyerRequestRepository.findOne({
      where: { id: buyerRequestId },
      relations: ['user'],
    });

    if (!buyerRequest) {
      throw new NotFoundException('Buyer request not found');
    }

    if (buyerRequest.status !== 'open') {
      throw new BadRequestException('Cannot submit offer to a closed request');
    }

    const product = await this.ProductRepository.findOne({
      where: { id: productId },
      relations: ['seller'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const seller = product.seller;

    if (!seller) {
      throw new NotFoundException('Product not Found!!');
    }

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const offer = this.offerRepository.create({
      buyerRequestId,
      sellerId: seller.id,
      title,
      description,
      price,
      productId,
      expiresAt,
    } as any);

    const savedOffer = await this.offerRepository.save(offer) as Offer;

    await this.notificationService.sendNotificationToUser({
      userId: buyerRequest.userId.toString(),
      title: 'New Offer Received',
      message: `${seller.name || 'A seller'} submitted an offer on your request ${buyerRequestId}.`,
      payload: {
        offerId: savedOffer.id,
        requestId: buyerRequest.id,
        sellerName: seller.name,
      },
      type: 'offer',
    });

    return savedOffer;
  }

  /**
   * Expire offers that have passed their expiration date and are still pending
   * This method is called by the cron job every 30 minutes
   */
  async expireOffers(): Promise<number> {
    const now = new Date();
    
    // Find all pending offers that have expired
    const expiredOffers = await this.offerRepository.find({
      where: {
        status: OfferStatus.PENDING,
        expiresAt: LessThan(now),
      },
    });

    if (expiredOffers.length === 0) {
      return 0;
    }

    // Update all expired offers to rejected status
    const updateResult = await this.offerRepository.update(
      {
        status: OfferStatus.PENDING,
        expiresAt: LessThan(now),
      },
      {
        status: OfferStatus.REJECTED,
        updatedAt: now,
      }
    );

    // Send notifications to sellers about expired offers
    for (const offer of expiredOffers) {
      await this.notificationService.sendNotificationToUser({
        userId: offer.sellerId.toString(),
        title: 'Offer Expired',
        message: `Your offer "${offer.title}" has expired and was automatically rejected.`,
        payload: {
          offerId: offer.id,
          requestId: offer.buyerRequestId,
          reason: 'expired',
        },
        type: 'offer',
      });
    }

    return updateResult.affected || 0;
  }

  /**
   * Get offers that are about to expire (within next hour)
   * Useful for sending warning notifications
   */
  async getOffersExpiringSoon(hours: number = 1): Promise<Offer[]> {
    const now = new Date();
    const warningTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.offerRepository.find({
      where: {
        status: OfferStatus.PENDING,
        expiresAt: LessThan(warningTime),
      },
    });
  }

  /**
   * Check if an offer has expired
   */
  async isOfferExpired(offerId: string): Promise<boolean> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      select: ['expiresAt', 'status'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer.status === OfferStatus.PENDING && offer.expiresAt < new Date();
  }
}
