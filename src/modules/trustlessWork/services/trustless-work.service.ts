import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { development, mainNet } from '@trustless-work/escrow';

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

@Injectable()
export class TrustlessWorkService implements OnModuleInit {
  private readonly logger = new Logger(TrustlessWorkService.name);
  private baseURL: string;
  private apiKey: string;
  private environment: 'development' | 'mainNet';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TRUSTLESS_WORK_API_KEY') || '';
    this.environment = this.configService.get<'development' | 'mainNet'>('TRUSTLESS_WORK_ENV') || 'development';
    this.baseURL = this.environment === 'mainNet' ? mainNet : development;
  }

  onModuleInit() {
    this.logger.log(`Trustless Work initialized with environment: ${this.environment}`);
    this.logger.log(`Base URL: ${this.baseURL}`);
    
    if (!this.apiKey) {
      this.logger.warn('TRUSTLESS_WORK_API_KEY not found in environment variables');
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
   * Create a new escrow
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
   * Get escrow by ID
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
   * Get all escrows for the current user
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
   * Release escrow funds
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
   * Cancel escrow
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
   * Health check
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
}