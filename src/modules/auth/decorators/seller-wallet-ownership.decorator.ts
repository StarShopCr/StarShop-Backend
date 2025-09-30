import { SetMetadata } from '@nestjs/common';

export const SELLER_WALLET_OWNERSHIP_KEY = 'sellerWalletOwnership';

/**
 * Decorator to mark routes that require seller wallet ownership validation.
 * This decorator should be used on routes where sellers perform operations
 * that could trigger contract calls, ensuring they can only act with their own wallet.
 * 
 * @example
 * @Post()
 * @UseGuards(JwtAuthGuard, RolesGuard, SellerWalletOwnershipGuard)
 * @Roles(Role.SELLER)
 * @RequireSellerWalletOwnership()
 * createOffer(@Body() dto: CreateOfferDto, @Request() req: AuthRequest)
 */
export const RequireSellerWalletOwnership = (): MethodDecorator & ClassDecorator => 
  SetMetadata(SELLER_WALLET_OWNERSHIP_KEY, true);
