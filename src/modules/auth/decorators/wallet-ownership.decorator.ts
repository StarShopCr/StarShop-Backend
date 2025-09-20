import { SetMetadata } from '@nestjs/common';
import { WALLET_OWNERSHIP_METADATA_KEY, WalletOwnershipConfig } from '../guards/wallet-ownership.guard';

/**
 * Decorator that marks routes requiring wallet ownership validation.
 * Use this decorator on controller methods where you need to ensure
 * the authenticated user's wallet matches a specific wallet address.
 * 
 * @example
 * // Validate that user's wallet matches 'sellerWallet' in request body
 * @RequireWalletOwnership()
 * @Post('create-offer')
 * 
 * @example
 * // Validate that user's wallet matches 'walletAddress' in params
 * @RequireWalletOwnership({ walletField: 'walletAddress', source: 'params' })
 * @Get(':walletAddress/offers')
 * 
 * @example
 * // Custom validation logic
 * @RequireWalletOwnership({ 
 *   walletField: 'targetWallet',
 *   customValidator: (userWallet, targetWallet) => userWallet === targetWallet.toLowerCase()
 * })
 * @Patch('transfer')
 * 
 * @param config Optional configuration for wallet validation
 */
export const RequireWalletOwnership = (config: WalletOwnershipConfig = {}) =>
  SetMetadata(WALLET_OWNERSHIP_METADATA_KEY, config);

/**
 * Shorthand decorator for common wallet ownership patterns.
 * Validates that the authenticated seller's wallet matches the sellerWallet field.
 */
export const RequireSellerWallet = () =>
  RequireWalletOwnership({ walletField: 'sellerWallet', source: 'body' });

/**
 * Validates wallet ownership from URL parameters.
 * Useful for routes like /api/wallet/:walletAddress/offers
 */
export const RequireWalletFromParams = (paramName = 'walletAddress') =>
  RequireWalletOwnership({ walletField: paramName, source: 'params' });
