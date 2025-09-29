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
import { User } from '../../users/entities/user.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,

    @InjectRepository(BuyerRequest)
    private buyerRequestRepository: Repository<BuyerRequest>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private dataSource: DataSource
  ) {}

  /**
   * Validates that the user's wallet address matches the expected wallet for seller operations.
   * This is crucial for preventing unauthorized contract calls.
   */
  private async validateSellerWalletOwnership(
    userId: number,
    expectedWalletAddress?: string
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.walletAddress) {
      throw new ForbiddenException('User wallet address not found');
    }

    // If an expected wallet address is provided, validate it matches
    if (expectedWalletAddress && user.walletAddress !== expectedWalletAddress) {
      throw new ForbiddenException(
        'Wallet address mismatch: You can only perform operations with your own wallet address'
      );
    }
  }

  /**
   * Validates that a user can only modify offers they own (wallet ownership validation).
   */
  private async validateOfferOwnership(offerId: string, userId: number): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['seller'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.sellerId !== userId) {
      throw new ForbiddenException('You can only modify your own offers');
    }

    // Additional wallet validation to prevent contract call issues
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (offer.seller.walletAddress !== user.walletAddress) {
      throw new ForbiddenException(
        'Wallet ownership mismatch: This offer belongs to a different wallet'
      );
    }

    return offer;
  }

  async create(createOfferDto: CreateOfferDto, sellerId: number): Promise<Offer> {
    // Validate seller wallet ownership to prevent unauthorized contract calls
    await this.validateSellerWalletOwnership(sellerId);

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

    const offer = this.offerRepository.create({
      ...createOfferDto,
      sellerId,
    });

    return this.offerRepository.save(offer);
  }

  async accept(offerId: string, buyerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['buyerRequest'],
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

    offer.status = OfferStatus.ACCEPTED;
    const acceptedOffer = await this.offerRepository.save(offer);

    await this.offerRepository.update(
      {
        buyerRequestId: offer.buyerRequestId,
        status: OfferStatus.PENDING,
      },
      { status: OfferStatus.REJECTED }
    );

    console.log(`Offer #${offerId} accepted by buyer #${buyerId}. Other pending offers rejected.`);
    return acceptedOffer;
  }

  async reject(offerId: string, buyerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['buyerRequest'],
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
    console.log(`Offer #${offerId} rejected by buyer #${buyerId}.`);
    return this.offerRepository.save(offer);
  }

  async findAll(page = 1, limit = 10): Promise<{ offers: Offer[]; total: number }> {
    const [offers, total] = await this.offerRepository.findAndCount({
      relations: ['seller', 'buyerRequest', 'attachments'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { offers, total };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['seller', 'buyerRequest', 'attachments'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto, userId: number): Promise<Offer> {
    // Validate wallet ownership before allowing updates that could trigger contract calls
    const offer = await this.validateOfferOwnership(id, userId);

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only update pending offers');
    }

    Object.assign(offer, updateOfferDto);
    return this.offerRepository.save(offer);
  }

  async remove(id: string, userId: number): Promise<void> {
    // Validate wallet ownership before allowing deletions that could affect contracts
    const offer = await this.validateOfferOwnership(id, userId);

    if (offer.status === OfferStatus.ACCEPTED) {
      throw new BadRequestException('Cannot delete accepted offers');
    }

    await this.offerRepository.remove(offer);
  }

  async findByBuyerRequest(buyerRequestId: number): Promise<Offer[]> {
    return this.offerRepository.find({
      where: { buyerRequestId },
      relations: ['seller', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySeller(
    sellerId: number,
    page = 1,
    limit = 10
  ): Promise<{ offers: Offer[]; total: number }> {
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { sellerId },
      relations: ['buyerRequest', 'attachments'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { offers, total };
  }

  /**
   * Validates that a buyer user can only confirm purchases for their own requests (wallet ownership).
   */
  private async validateBuyerWalletOwnership(
    offerId: string,
    buyerId: string
  ): Promise<{ offer: Offer; buyerUser: User }> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['buyerRequest', 'buyerRequest.user'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.buyerRequest.userId.toString() !== buyerId) {
      throw new ForbiddenException('You are not authorized to confirm this offer');
    }

    // Get the buyer user to validate wallet ownership
    const buyerUser = await this.userRepository.findOne({
      where: { id: parseInt(buyerId) },
    });

    if (!buyerUser) {
      throw new ForbiddenException('Buyer not found');
    }

    // Validate that the authenticated buyer's wallet matches the request owner's wallet
    if (offer.buyerRequest.user.walletAddress !== buyerUser.walletAddress) {
      throw new ForbiddenException(
        'Wallet ownership mismatch: You can only confirm purchases with your own wallet'
      );
    }

    return { offer, buyerUser };
  }

  async confirmPurchase(offerId: string, buyerId: string): Promise<Offer> {
    // Validate buyer wallet ownership before confirming purchase (could trigger contract calls)
    const { offer } = await this.validateBuyerWalletOwnership(offerId, buyerId);

    return this.dataSource.transaction(async (manager) => {
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
}
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
