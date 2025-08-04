import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common"
import { Repository } from "typeorm"
import { Offer, OfferStatus } from "../entities/offer.entity"
import { CreateOfferDto } from "../dto/create-offer.dto"
import { UpdateOfferDto } from "../dto/update-offer.dto"
import { BuyerRequest, BuyerRequestStatus } from "../../buyer-requests/entities/buyer-request.entity"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource } from "typeorm"

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    @InjectRepository(BuyerRequest)
    private buyerRequestRepository: Repository<BuyerRequest>,
    private dataSource: DataSource,
  ) {}

  async create(createOfferDto: CreateOfferDto, sellerId: string): Promise<Offer> {
    // Verify buyer request exists and is open
    const buyerRequest = await this.buyerRequestRepository.findOne({
      where: { id: createOfferDto.buyerRequestId },
    })

    if (!buyerRequest) {
      throw new NotFoundException("Buyer request not found")
    }

    if (buyerRequest.status !== "open") {
      throw new BadRequestException("Cannot create offer for closed buyer request")
    }

    // Check if seller already has an offer for this request
    const existingOffer = await this.offerRepository.findOne({
      where: {
        buyerRequestId: createOfferDto.buyerRequestId,
        sellerId,
      },
    })

    if (existingOffer) {
      throw new BadRequestException("You already have an offer for this buyer request")
    }

    const offer = this.offerRepository.create({
      ...createOfferDto,
      sellerId,
    })

    return this.offerRepository.save(offer)
  }

  async accept(offerId: string, buyerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ["buyerRequest"],
    });

    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    if (offer.buyerRequest.userId.toString() !== buyerId) {
      throw new ForbiddenException("You are not authorized to accept this offer");
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
      throw new BadRequestException("Another offer has already been accepted for this request");
    }

    // 1. Accept the current offer
    offer.status = OfferStatus.ACCEPTED;
    const acceptedOffer = await this.offerRepository.save(offer);

    // 2. Reject all other pending offers for the same buyer request
    await this.offerRepository.update(
      {
        buyerRequestId: offer.buyerRequestId,
        status: OfferStatus.PENDING,
      },
      { status: OfferStatus.REJECTED },
    );

    console.log(`Offer #${offerId} accepted by buyer #${buyerId}. Other pending offers rejected.`);
    return acceptedOffer;
  }

  async reject(offerId: string, buyerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ["buyerRequest"],
    });

    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    if (offer.buyerRequest.userId.toString() !== buyerId) {
      throw new ForbiddenException("You are not authorized to reject this offer");
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(`Cannot reject an offer that is already ${offer.status}`);
    }

    offer.status = OfferStatus.REJECTED;
    console.log(`Offer #${offerId} rejected by buyer #${buyerId}.`);
    return this.offerRepository.save(offer);
  }
  async findAll(page = 1, limit = 10): Promise<{ offers: Offer[]; total: number }> {
    const [offers, total] = await this.offerRepository.findAndCount({
      relations: ["seller", "buyerRequest", "attachments"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { offers, total }
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ["seller", "buyerRequest", "attachments"],
    })

    if (!offer) {
      throw new NotFoundException("Offer not found")
    }

    return offer
  }

  async update(id: string, updateOfferDto: UpdateOfferDto, userId: string): Promise<Offer> {
    const offer = await this.findOne(id)

    if (offer.sellerId !== userId) {
      throw new ForbiddenException("You can only update your own offers")
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException("Can only update pending offers")
    }

    Object.assign(offer, updateOfferDto)
    return this.offerRepository.save(offer)
  }

  async remove(id: string, userId: string): Promise<void> {
    const offer = await this.findOne(id)

    if (offer.sellerId !== userId) {
      throw new ForbiddenException("You can only delete your own offers")
    }

    if (offer.status === OfferStatus.ACCEPTED) {
      throw new BadRequestException("Cannot delete accepted offers")
    }

    await this.offerRepository.remove(offer)
  }

  async findByBuyerRequest(buyerRequestId: string): Promise<Offer[]> {
    return this.offerRepository.find({
      where: { buyerRequestId },
      relations: ["seller", "attachments"],
      order: { createdAt: "DESC" },
    })
  }

  async findBySeller(sellerId: string, page = 1, limit = 10): Promise<{ offers: Offer[]; total: number }> {
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { sellerId },
      relations: ["buyerRequest", "attachments"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { offers, total }
  }

  async confirmPurchase(offerId: string, buyerId: string): Promise<Offer> {
    return this.dataSource.transaction(async manager => {
      const offer = await manager.findOne(Offer, {
        where: { id: offerId },
        relations: ["buyerRequest"],
      });
      if (!offer) throw new NotFoundException("Offer not found");
      if (offer.buyerRequest.userId.toString() !== buyerId)
        throw new ForbiddenException("You are not authorized to confirm this offer");
      if (offer.wasPurchased)
        throw new BadRequestException("This offer has already been confirmed as purchased");
      // Set wasPurchased and BuyerRequest status
      offer.wasPurchased = true;
      await manager.save(offer);
      // Set BuyerRequest status to fulfilled if not already
      if (offer.buyerRequest.status !== BuyerRequestStatus.FULFILLED) {
        offer.buyerRequest.status = BuyerRequestStatus.FULFILLED;
        await manager.save(offer.buyerRequest);
      }
      return offer;
    });
  }
}
