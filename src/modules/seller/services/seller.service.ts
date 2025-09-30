import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BuildRegisterDto } from '../dto/build-register.dto';
import { SubmitRegisterDto } from '../dto/submit-register.dto';

@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Build unsigned XDR for seller registration on Soroban
   */
  async buildRegister(userId: number, buildRegisterDto: BuildRegisterDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user has seller role
    const hasSellerRole = user.userRoles?.some(
      (userRole) => userRole.role.name === 'seller'
    );

    if (!hasSellerRole) {
      throw new BadRequestException('User must have seller role');
    }

    // Check if user already has a payout wallet registered
    if (user.payoutWallet) {
      throw new ConflictException('User already has a payout wallet registered');
    }

    // Check if the payout wallet is already used by another user
    const existingUser = await this.userRepository.findOne({
      where: { payoutWallet: buildRegisterDto.payoutWallet },
    });

    if (existingUser) {
      throw new ConflictException('Payout wallet already registered by another user');
    }

    // TODO: Integrate with Soroban SDK to build actual XDR
    // For now, return mock data
    const mockUnsignedXdr = this.generateMockXdr(user.walletAddress, buildRegisterDto.payoutWallet);
    const contractAddress = 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    return {
      unsignedXdr: mockUnsignedXdr,
      contractAddress,
    };
  }

  /**
   * Submit signed XDR and update user registration status
   */
  async submitRegister(userId: number, submitRegisterDto: SubmitRegisterDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user has seller role
    const hasSellerRole = user.userRoles?.some(
      (userRole) => userRole.role.name === 'seller'
    );

    if (!hasSellerRole) {
      throw new BadRequestException('User must have seller role');
    }

    // TODO: Validate signed XDR and submit to Soroban network
    // TODO: Extract payout wallet from XDR transaction
    // For now, use mock validation and data
    
    if (!this.validateSignedXdr(submitRegisterDto.signedXdr)) {
      throw new BadRequestException('Invalid signed XDR');
    }

    const mockPayoutWallet = this.extractPayoutWalletFromXdr(submitRegisterDto.signedXdr);
    const mockTransactionHash = this.generateMockTransactionHash();
    const mockContractId = 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    // Update user with payout wallet and registration status
    await this.userRepository.update(userId, {
      payoutWallet: mockPayoutWallet,
      sellerOnchainRegistered: true,
    });

    return {
      transactionHash: mockTransactionHash,
      contractId: mockContractId,
      payoutWallet: mockPayoutWallet,
      registered: true,
    };
  }

  /**
   * Get seller registration status
   */
  async getRegistrationStatus(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'payoutWallet', 'sellerOnchainRegistered'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      isRegistered: user.sellerOnchainRegistered,
      payoutWallet: user.payoutWallet,
    };
  }

  // Mock methods - replace with actual Soroban integration
  private generateMockXdr(walletAddress: string, payoutWallet: string): string {
    const mockData = `${walletAddress}:${payoutWallet}:${Date.now()}`;
    return Buffer.from(mockData).toString('base64');
  }

  private validateSignedXdr(signedXdr: string): boolean {
    // TODO: Implement actual XDR validation with Soroban SDK
    return signedXdr && signedXdr.length > 10;
  }

  private extractPayoutWalletFromXdr(): string {
    // TODO: Extract actual payout wallet from XDR
    // For now, return a mock wallet
    return 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  }

  private generateMockTransactionHash(): string {
    return Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}
