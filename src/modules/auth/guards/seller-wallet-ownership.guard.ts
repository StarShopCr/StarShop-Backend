import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';

export const SELLER_WALLET_OWNERSHIP_KEY = 'sellerWalletOwnership';

/**
 * Guard that validates seller wallet ownership for operations that could trigger contract calls.
 * This guard ensures that:
 * 1. The user has seller role (checked by RolesGuard)
 * 2. For operations on existing offers, the user's wallet matches the seller's wallet
 * 3. Prevents unauthorized contract calls by validating wallet ownership
 */
@Injectable()
export class SellerWalletOwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresWalletOwnership = this.reflector.get<boolean>(
      SELLER_WALLET_OWNERSHIP_KEY,
      context.getHandler()
    );

    if (!requiresWalletOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.walletAddress) {
      throw new ForbiddenException('User wallet address not found');
    }

    // For operations that involve existing offers (update, delete, etc.)
    const offerId = request.params.id;
    if (offerId) {
      const offer = await this.offerRepository.findOne({
        where: { id: offerId },
        relations: ['seller'],
      });

      if (!offer) {
        throw new ForbiddenException('Offer not found');
      }

      // Verify that the authenticated user's wallet matches the offer seller's wallet
      if (offer.seller.walletAddress !== user.walletAddress) {
        throw new ForbiddenException(
          'Wallet mismatch: You can only perform operations on offers associated with your wallet'
        );
      }
    }

    // For new operations (create), wallet ownership is implicitly validated
    // since the user can only create offers with their own wallet
    return true;
  }
}
