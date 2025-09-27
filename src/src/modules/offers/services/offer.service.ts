import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Offer } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { Product } from '@/modules/products/entities/product.entity';

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

    const offer = this.offerRepository.create({
      buyerRequestId,
      sellerId: seller.id,
      title,
      description,
      price,
      productId,
    });

    const savedOffer = await this.offerRepository.save(offer);

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
}
