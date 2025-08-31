import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { BuyerRequest, BuyerRequestStatus } from '../../buyer-requests/entities/buyer-request.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,

    @InjectRepository(BuyerRequest)
    private buyerRequestRepository: Repository<BuyerRequest>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    private dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createOfferDto: CreateOfferDto, sellerId: number): Promise<Offer> {
    const buyerRequest = await this.buyerRequestRepository.findOne({
      where: { id: createOfferDto.buyerRequestId },
    });

    if (!buyerRequest) {
      throw new NotFoundException('Buyer request not found');
    }

    if (buyerRequest.status !== BuyerRequestStatus.OPEN) {
      throw new BadRequestException('Cannot create offer for closed buyer request');
    }

    const existingOffer = await this.offerRepository.findOne({
      where: {
        buyerRequestId: createOfferDto.buyerRequestId,
        sellerId,
      },
    });

    if (existingOffer) {
      throw new BadRequestException('You already have an offer for this buyer request');
    }

    let linkedProduct: Product = null;
    if (createOfferDto.productId) {
      linkedProduct = await this.productRepository.findOne({
        where: { id: createOfferDto.productId },
      });

      if (!linkedProduct) {
        throw new NotFoundException('Product not found');
      }

      if (linkedProduct.sellerId !== sellerId) {
        throw new ForbiddenException('You cannot link a product you do not own');
      }
    }

    const offer = this.offerRepository.create({
      ...createOfferDto,
      sellerId,
      product: linkedProduct,
    });

    return this.offerRepository.save(offer);
  }

  async accept(offerId: string, buyerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['buyerRequest', 'seller'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.buyerRequest.userId.toString() !== buyerId) {
      throw new ForbiddenException('You are not authorized to accept this offer');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(`Cannot accept an offer that is already ${offer.status}`);
    }

    const alreadyAccepted = await this.offerRepository.findOne({
      where: {
        buyerRequestId: offer.buyerRequestId,
        status: OfferStatus.ACCEPTED,
      },
    });

    if (alreadyAccepted) {
      throw new BadRequestException('Another offer has already been accepted for this request');
    }

    // 1) Aceptar la oferta actual
    offer.status = OfferStatus.ACCEPTED;
    const acceptedOffer = await this.offerRepository.save(offer);

    // 2) Notificar al seller que su oferta fue aceptada
    await this.notifyOfferStatusChange(acceptedOffer, 'accepted');

    // 3) Obtener ofertas pendientes para notificarlas y rechazarlas
    const pendingOffers = await this.offerRepository.find({
      where: {
        buyerRequestId: offer.buyerRequestId,
        status: OfferStatus.PENDING,
      },
      relations: ['buyerRequest', 'seller'],
    });

    // 4) Rechazar y notificar cada oferta pendiente
    for (const pendingOffer of pendingOffers) {
      pendingOffer.status = OfferStatus.REJECTED;
      await this.offerRepository.save(pendingOffer);
      await this.notifyOfferStatusChange(pendingOffer, 'rejected');
    }

    console.log(
      `Offer #${offerId} accepted by buyer #${buyerId}. ${pendingOffers.length} other pending offers rejected.`,
    );
    return acceptedOffer;
  }

  async reject(offerId: string, buyerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['buyerRequest', 'seller'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.buyerRequest.userId.toString() !== buyerId) {
      throw new ForbiddenException('You are not authorized to reject this offer');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(`Cannot reject an offer that is already ${offer.status}`);
    }

    offer.status = OfferStatus.REJECTED;
    const rejectedOffer = await this.offerRepository.save(offer);

    // Notificar al seller que su oferta fue rechazada
    await this.notifyOfferStatusChange(rejectedOffer, 'rejected');

    console.log(`Offer #${offerId} rejected by buyer #${buyerId}.`);
    return rejectedOffer;
  }

  /**
   * Maneja notificaciones de cambio de estado de oferta
   */
  private async notifyOfferStatusChange(
    offer: Offer,
    status: 'accepted' | 'rejected',
  ): Promise<void> {
    try {
      const notificationType = status === 'accepted' ? 'offer_accepted' : 'offer_rejected';
      const message =
        status === 'accepted'
          ? `Your offer for "${offer.buyerRequest.title}" has been accepted!`
          : `Your offer for "${offer.buyerRequest.title}" has been rejected.`;

      await this.notificationService.createAndSendNotificationToUser({
        userId: offer.sellerId.toString(),
        title: status === 'accepted' ? 'Offer Accepted!' : 'Offer Rejected',
        message,
        type: notificationType,
        payload: {
          offerId: offer.id,
          requestTitle: offer.buyerRequest.title,
        },
        entityId: offer.id,
      });

      console.log(`✅ Notification sent to seller ${offer.sellerId} for offer ${offer.id} (${status})`);
    } catch (error) {
      console.error(`❌ Failed to send notification for offer ${offer.id}:`, error);
      // No relanzamos el error para no afectar el flujo principal
    }
  }

  async findAll(page = 1, limit = 10): Promise<{ offers: Offer[]; total: number }> {
    const [offers, total] = await this.offerRepository.findAndCount({
      relations: ['seller', 'buyerRequest', 'attachments', 'product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { offers, total };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['seller', 'buyerRequest', 'attachments', 'product'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto, userId: number): Promise<Offer> {
    const offer = await this.findOne(id);

    if (offer.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own offers');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only update pending offers');
    }

    Object.assign(offer, updateOfferDto);
    return this.offerRepository.save(offer);
  }

  async remove(id: string, userId: number): Promise<void> {
    const offer = await this.findOne(id);

    if (offer.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own offers');
    }

    if (offer.status === OfferStatus.ACCEPTED) {
      throw new BadRequestException('Cannot delete accepted offers');
    }

    await this.offerRepository.remove(offer);
  }

  async findByBuyerRequest(buyerRequestId: number): Promise<Offer[]> {
    return this.offerRepository.find({
      where: { buyerRequestId },
      relations: ['seller', 'attachments', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySeller(
    sellerId: number,
    page = 1,
    limit = 10,
  ): Promise<{ offers: Offer[]; total: number }> {
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { sellerId },
      relations: ['buyerRequest', 'attachments', 'product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { offers, total };
  }

  async confirmPurchase(offerId: string, buyerId: string): Promise<Offer> {
    return this.dataSource.transaction(async (manager) => {
      const offer = await manager.findOne(Offer, {
        where: { id: offerId },
        relations: ['buyerRequest'],
      });

      if (!offer) throw new NotFoundException('Offer not found');

      if (offer.buyerRequest.userId.toString() !== buyerId) {
        throw new ForbiddenException('You are not authorized to confirm this offer');
      }

      if (offer.wasPurchased) {
        throw new BadRequestException('This offer has already been confirmed as purchased');
      }

      offer.wasPurchased = true;
      await manager.save(offer);

      if (offer.buyerRequest.status !== BuyerRequestStatus.FULFILLED) {
        offer.buyerRequest.status = BuyerRequestStatus.FULFILLED;
        await manager.save(offer.buyerRequest);
      }

      return offer;
    });
  }
}
