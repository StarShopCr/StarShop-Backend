import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { logger } from '../utils/logger';
import type { SmartContractConfig, ContractInstance } from './types';

class WalletService {
  private wallet: Wallet;
  private provider: JsonRpcProvider;
  private config: SmartContractConfig;
  private contracts: Map<string, Contract> = new Map();

  constructor(config: SmartContractConfig) {
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY environment variable is required');
    }

    this.config = config;
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.initializeContracts();
  }

  private initializeContracts(): void {
    for (const [name, definition] of Object.entries(this.config.contracts)) {
      const contract = new Contract(definition.address, definition.abi, this.wallet);
      this.contracts.set(name, contract);
      logger.info(`Contract "${name}" initialized at ${definition.address}`);
    }
  }

  getWallet(): Wallet {
    return this.wallet;
  }

  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  getContract(name: string): Contract {
    const contract = this.contracts.get(name);
    if (!contract) {
      throw new Error(`Contract "${name}" not found`);
    }
    return contract;
  }

  async getBalance(): Promise<bigint> {
    return await this.wallet.getBalance();
  }

  getAddress(): string {
    return this.wallet.address;
  }
}

let walletService: WalletService | null = null;

export const initWalletService = (config: SmartContractConfig): WalletService => {
  if (walletService) return walletService;
  walletService = new WalletService(config);
  return walletService;
};

export const getWalletService = (): WalletService | null => walletService;
