import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { BuyerRequest } from '../entities/buyer-request.entity';
import { Product } from '../../products/entities/product.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { OfferStatus } from '../enums/offer-status.enum';
import { AppUser } from 'src/types/auth-request.type';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(BuyerRequest)
    private readonly buyerRequestRepository: Repository<BuyerRequest>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createOffer(createOfferDto: CreateOfferDto, seller: AppUser): Promise<Offer> {
    const { requestId, productId, ...offerData } = createOfferDto;
    const sellerId = Number(seller.id);

    const request = await this.buyerRequestRepository.findOneBy({ id: requestId });
    if (!request) {
      throw new NotFoundException(`BuyerRequest with ID ${requestId} not found.`);
    }

    if (productId) {
      const product = await this.productRepository.findOneBy({ id: productId, sellerId: sellerId });
      if (!product) {
        throw new ForbiddenException(`Product with ID ${productId} does not exist or does not belong to you.`);
      }
    }

    const offer = this.offerRepository.create({
      ...offerData,
      requestId,
      productId,
      sellerId: sellerId,
    });

    console.log(`Seller #${sellerId} created offer for request #${requestId}`);
    return this.offerRepository.save(offer);
  }

  async getOffersForRequest(requestId: number): Promise<Offer[]> {
    return this.offerRepository.find({ where: { requestId } });
  }

  async acceptOffer(offerId: number, buyerId: number): Promise<Offer> {
    const offer = await this.findOfferAndValidate(offerId, buyerId);

    offer.status = OfferStatus.ACCEPTED;
    const savedOffer = await this.offerRepository.save(offer);
    console.log(`Offer #${offerId} accepted by buyer #${buyerId}`);

    const otherOffers = await this.offerRepository.find({
        where: { requestId: offer.requestId, status: OfferStatus.PENDING },
        select: ['id'],
    });

    if (otherOffers.length > 0) {
        const otherOfferIds = otherOffers.map(o => o.id);
        await this.offerRepository.update(
          { id: In(otherOfferIds) },
          { status: OfferStatus.REJECTED },
        );
        console.log(`Other offers for request #${offer.requestId} have been rejected.`);
    }

    return savedOffer;
  }

  async rejectOffer(offerId: number, buyerId: number): Promise<Offer> {
    const offer = await this.findOfferAndValidate(offerId, buyerId);

    offer.status = OfferStatus.REJECTED;
    console.log(`Offer #${offerId} rejected by buyer #${buyerId}`);
    return this.offerRepository.save(offer);
  }

  private async findOfferAndValidate(offerId: number, buyerId: number): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['request'],
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found.`);
    }
    if (offer.request.buyerId !== buyerId) {
      throw new ForbiddenException('You are not authorized to perform this action.');
    }
    if (offer.status !== OfferStatus.PENDING) {
      throw new UnprocessableEntityException(`Cannot process an offer that is already ${offer.status}.`);
    }

    const acceptedOffer = await this.offerRepository.findOneBy({ requestId: offer.requestId, status: OfferStatus.ACCEPTED });
    if (acceptedOffer) {
        throw new UnprocessableEntityException('An offer for this request has already been accepted.');
    }

    return offer;
  }
}