import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { development, mainNet } from '@trustless-work/escrow';

// Stellar/Soroban imports
import {
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Contract,
  xdr,
} from 'stellar-sdk';

export interface TWConfig {
  baseURL: string;
  apiKey: string;
  environment: 'development' | 'mainNet';
}

export interface CreateEscrowDto {
  amount: string;
  token: string;
  recipient: string;
  description?: string;
  deadline?: number;
}

export interface EscrowResponse {
  id: string;
  status: string;
  amount: string;
  token: string;
  creator: string;
  recipient: string;
  description?: string;
  createdAt: string;
  deadline?: number;
}

// DTO para integración Soroban
export interface InitializeEscrowDto extends CreateEscrowDto {
  sellerPublicKey: string;
  type?: 'draft' | 'deploy';
}

@Injectable()
export class TrustlessWorkService implements OnModuleInit {
  private readonly logger = new Logger(TrustlessWorkService.name);
  private baseURL: string;
  private apiKey: string;
  private environment: 'development' | 'mainNet';

  // Soroban config
  private sorobanServer: SorobanRpc.Server;
  private networkPassphrase: string;
  private contractId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TRUSTLESS_WORK_API_KEY') || '';
    this.environment = this.configService.get<'development' | 'mainNet'>('TRUSTLESS_WORK_ENV') || 'development';
    this.baseURL = this.environment === 'mainNet' ? mainNet : development;

    // Soroban config
    this.networkPassphrase = this.environment === 'mainNet'
      ? Networks.PUBLIC
      : Networks.TESTNET;

    this.sorobanServer = new SorobanRpc.Server(
      this.configService.get<string>('SOROBAN_RPC_URL') || 'https://soroban-testnet.stellar.org'
    );

    this.contractId = this.configService.get<string>('TRUSTLESS_WORK_CONTRACT_ID') || '';
  }

  onModuleInit() {
    this.logger.log(`Trustless Work initialized with environment: ${this.environment}`);
    this.logger.log(`Base URL: ${this.baseURL}`);

    if (!this.apiKey) {
      this.logger.warn('TRUSTLESS_WORK_API_KEY not found in environment variables');
    }
    if (!this.contractId) {
      this.logger.warn('TRUSTLESS_WORK_CONTRACT_ID not found in environment variables');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TWConfig {
    return {
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      environment: this.environment,
    };
  }

  /**
   * Create a new escrow via API REST
   */
  async createEscrow(escrowData: CreateEscrowDto): Promise<EscrowResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(escrowData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(`Escrow created successfully: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating escrow:', error);
      throw error;
    }
  }

  /**
   * Create a new escrow on Soroban (Stellar)
   */
  async initializeEscrow(escrowData: InitializeEscrowDto) {
    try {
      this.logger.log(`Initializing escrow for seller: ${escrowData.sellerPublicKey}`);

      // Validate all payload fields
      this.validateEscrowPayload(escrowData);

      // Get seller account
      const sellerKeypair = Keypair.fromPublicKey(escrowData.sellerPublicKey);
      const sellerAccount = await this.sorobanServer.getAccount(sellerKeypair.publicKey());

      // Create contract instance
      const contract = new Contract(this.contractId);

      // Build transaction
      const transaction = new TransactionBuilder(sellerAccount, {
        fee: '1000000', // 1 XLM
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'initialize_escrow',
            xdr.ScVal.scvString(escrowData.amount),
            xdr.ScVal.scvString(escrowData.token),
            xdr.ScVal.scvString(escrowData.recipient),
            xdr.ScVal.scvString(escrowData.description || ''),
            xdr.ScVal.scvU64(new xdr.Uint64(escrowData.deadline || 0))
          )
        )
        .setTimeout(30)
        .build();

      // Simulate transaction first
      const simulationResult = await this.sorobanServer.simulateTransaction(transaction);

      if (SorobanRpc.isSimulationError(simulationResult)) {
        throw new Error(`Simulation failed: ${simulationResult.error}`);
      }

      // Prepare transaction for signing
      const preparedTransaction = SorobanRpc.assembleTransaction(
        transaction,
        this.networkPassphrase,
        simulationResult
      );

      // Generate contract ID (this would be deterministic based on the transaction)
      const contractId = this.generateContractId(escrowData);

      return {
        contractId,
        xdr: preparedTransaction.toXDR(),
        simulationResult,
      };

    } catch (error) {
      this.logger.error('Error initializing escrow:', error);
      throw error;
    }
  }

  /**
   * Get escrow by ID via API REST
   */
  async getEscrow(escrowId: string): Promise<EscrowResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/escrow/${escrowId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching escrow ${escrowId}:`, error);
      throw error;
    }
  }

  /**
   * Get all escrows for the current user via API REST
   */
  async getUserEscrows(): Promise<EscrowResponse[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/escrow/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Error fetching user escrows:', error);
      throw error;
    }
  }

  /**
   * Release escrow funds via API REST
   */
  async releaseEscrow(escrowId: string): Promise<{ success: boolean; transactionHash?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/escrow/${escrowId}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(`Escrow ${escrowId} released successfully`);
      return data;
    } catch (error) {
      this.logger.error(`Error releasing escrow ${escrowId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel escrow via API REST
   */
  async cancelEscrow(escrowId: string): Promise<{ success: boolean; transactionHash?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/escrow/${escrowId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(`Escrow ${escrowId} cancelled successfully`);
      return data;
    } catch (error) {
      this.logger.error(`Error cancelling escrow ${escrowId}:`, error);
      throw error;
    }
  }

  /**
   * Health check via API REST
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Check if seller is registered on-chain (Soroban)
   */
  async checkSellerRegistration(publicKey: string): Promise<boolean> {
    try {
      const contract = new Contract(this.contractId);

      // Build query transaction
      const sourceAccount = await this.sorobanServer.getAccount(publicKey);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call('is_seller_registered', xdr.ScVal.scvString(publicKey))
        )
        .setTimeout(30)
        .build();

      const result = await this.sorobanServer.simulateTransaction(transaction);

      if (SorobanRpc.isSimulationError(result)) {
        this.logger.warn(`Seller registration check failed: ${result.error}`);
        return false;
      }

      // Parse result - assuming it returns a boolean
      const isRegistered = result.result?.retval &&
        xdr.ScVal.fromXDR(result.result.retval, 'base64').switch().name === 'scvBool' &&
        xdr.ScVal.fromXDR(result.result.retval, 'base64').b();

      return Boolean(isRegistered);

    } catch (error) {
      this.logger.error(`Error checking seller registration for ${publicKey}:`, error);
      return false;
    }
  }

  /**
   * Get escrows for a specific seller (Soroban)
   */
  async getSellerEscrows(publicKey: string) {
    try {
      const contract = new Contract(this.contractId);

      const sourceAccount = await this.sorobanServer.getAccount(publicKey);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call('get_seller_escrows', xdr.ScVal.scvString(publicKey))
        )
        .setTimeout(30)
        .build();

      const result = await this.sorobanServer.simulateTransaction(transaction);
      
      if (SorobanRpc.isSimulationError(result)) {
        throw new Error(`Failed to get seller escrows: ${result.error}`);
      }

      // Parse and return the escrows list
      return this.parseEscrowsList(result.result?.retval);

    } catch (error) {
      this.logger.error(`Error getting seller escrows for ${publicKey}:`, error);
      throw error;
    }
  }

  /**
   * Confirm escrow creation after transaction is successful (Soroban)
   */
  async confirmEscrow(confirmData: { transactionHash: string; contractId: string }) {
    try {
      // Get transaction details from Stellar
      const txResult = await this.sorobanServer.getTransaction(confirmData.transactionHash);

      if (txResult.status !== 'SUCCESS') {
        throw new Error('Transaction was not successful');
      }

      this.logger.log(`Escrow confirmed: ${confirmData.contractId}`);

      return {
        success: true,
        contractId: confirmData.contractId,
        transactionHash: confirmData.transactionHash,
        status: 'confirmed',
      };

    } catch (error) {
      this.logger.error('Error confirming escrow:', error);
      throw error;
    }
  }

  /**
   * Validate escrow payload (Soroban)
   */
  private validateEscrowPayload(escrowData: InitializeEscrowDto) {
    const requiredFields = ['amount', 'token', 'recipient', 'sellerPublicKey'];

    for (const field of requiredFields) {
      if (!escrowData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate amount is positive
    if (parseFloat(escrowData.amount) <= 0) {
      throw new Error('Amount must be positive');
    }

    // Validate addresses
    try {
      Keypair.fromPublicKey(escrowData.sellerPublicKey);
      Keypair.fromPublicKey(escrowData.recipient);
    } catch {
      throw new Error('Invalid public key format');
    }
  }

  /**
   * Generate deterministic contract ID (Soroban)
   */
  private generateContractId(escrowData: InitializeEscrowDto): string {
    // This should generate a deterministic ID based on the escrow parameters
    // In a real implementation, this would be based on the actual contract deployment
    const hash = require('crypto')
      .createHash('sha256')
      .update(`${escrowData.sellerPublicKey}-${escrowData.recipient}-${escrowData.amount}-${Date.now()}`)
      .digest('hex');

    return `escrow_${hash.substring(0, 16)}`;
  }

  /**
   * Parse escrows list from contract response (Soroban)
   */
  private parseEscrowsList(retval: string | undefined): any[] {
    if (!retval) return [];

    try {
      // Parse the XDR response - this depends on your contract's return format
      const scVal = xdr.ScVal.fromXDR(retval, 'base64');
      // Implement parsing logic based on your contract structure
      return []; // Placeholder
    } catch {
      return [];
    }
  }
}