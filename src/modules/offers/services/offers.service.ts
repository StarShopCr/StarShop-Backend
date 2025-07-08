import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common"
import { Repository } from "typeorm"
import { Offer, OfferStatus } from "../entities/offer.entity"
import { CreateOfferDto } from "../dto/create-offer.dto"
import { UpdateOfferDto } from "../dto/update-offer.dto"
import { BuyerRequest } from "../../buyer-requests/entities/buyer-request.entity"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    @InjectRepository(BuyerRequest)
    private buyerRequestRepository: Repository<BuyerRequest>,
  ) {}

  async create(createOfferDto: CreateOfferDto, sellerId: string): Promise<Offer> {
    // Verify buyer request exists and is open
    const buyerRequest = await this.buyerRequestRepository.findOne({
      where: { id: Number(createOfferDto.buyerRequestId) },
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
}
