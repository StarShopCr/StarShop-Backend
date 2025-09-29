import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const WALLET_OWNERSHIP_METADATA_KEY = 'walletOwnership';

export interface WalletOwnershipConfig {
  /**
   * The name of the parameter or body field that contains the seller wallet address
   * Default: 'sellerWallet'
   */
  walletField?: string;
  
  /**
   * Where to find the wallet address: 'params', 'body', or 'query'
   * Default: 'body'
   */
  source?: 'params' | 'body' | 'query';
  
  /**
   * Custom validation function that receives (userWallet: string, targetWallet: string) => boolean
   * Default: simple equality check
   */
  customValidator?: (userWallet: string, targetWallet: string) => boolean;
}

/**
 * Guard that validates wallet ownership for seller operations.
 * Ensures that req.user.walletAddress matches the sellerWallet specified in the request.
 * This prevents unauthorized users from triggering contract calls with someone else's wallet.
 */
@Injectable()
export class WalletOwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const walletOwnershipConfig = this.reflector.get<WalletOwnershipConfig>(
      WALLET_OWNERSHIP_METADATA_KEY,
      context.getHandler()
    );

    // If no wallet ownership required, allow access
    if (!walletOwnershipConfig) {
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

    // Get the wallet field configuration
    const {
      walletField = 'sellerWallet',
      source = 'body',
      customValidator
    } = walletOwnershipConfig;

    // Extract the target wallet address from the request
    let targetWallet: string;
    switch (source) {
      case 'params':
        targetWallet = request.params[walletField];
        break;
      case 'query':
        targetWallet = request.query[walletField];
        break;
      case 'body':
      default:
        targetWallet = request.body[walletField];
        break;
    }

    // If no target wallet specified, check if this is a seller operation that should validate ownership
    if (!targetWallet) {
      // For routes without explicit sellerWallet parameter, validate that the user is acting on their own behalf
      // This is for operations like "create offer" where the seller is implicitly the authenticated user
      return true; // Let other guards handle role validation
    }

    // Validate wallet ownership
    const isValidOwner = customValidator 
      ? customValidator(user.walletAddress, targetWallet)
      : user.walletAddress === targetWallet;

    if (!isValidOwner) {
      throw new ForbiddenException('Wallet address mismatch. You can only perform operations with your own wallet.');
    }

    return true;
  }
}
