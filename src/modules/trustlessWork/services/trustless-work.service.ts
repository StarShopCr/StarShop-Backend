import { Injectable, HttpException, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  InitializeEscrowDto,
  SendSignedTransactionDto,
  EscrowType,
  DeploySingleReleaseEscrowDto,
  DeployMultiReleaseEscrowDto,
  FundEscrowDto,
  GetEscrowDto,
  ApproveMilestoneDto,
  ReleaseFundsDto,
  ReleaseMilestoneFundsDto,
  DisputeEscrowDto,
  ResolveDisputeDto,
  UpdateEscrowDto,
  SetTrustlineDto,
  SendTransactionDto,
  GetEscrowsBySignerDto,
  GetEscrowsByRoleDto,
} from '../dtos/trustless-work.dto';

@Injectable()
export class TrustlessWorkService {
  private readonly logger = new Logger(TrustlessWorkService.name);
  private readonly baseUrl: string;
  private readonly apiHeaders: Record<string, string>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('TRUSTLESS_WORK_API_URL', 'https://api.trustlesswork.com');
    
    // Configurar headers por defecto
    this.apiHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Si tienes API key, agrégala aquí
    const apiKey = this.configService.get<string>('TRUSTLESS_WORK_API_KEY');
    if (apiKey) {
      this.apiHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    this.logger.log(`Trustless Work Service initialized with base URL: ${this.baseUrl}`);
  }

  // =====================
  // MAIN INITIALIZE ESCROW METHOD (Para la Issue #3)
  // =====================

  async initializeEscrow(initDto: InitializeEscrowDto): Promise<{
    success: boolean;
    contract_id?: string;
    unsigned_xdr?: string;
    message?: string;
  }> {
    this.logger.log('Initializing escrow', {
      type: initDto.type,
      seller: initDto.seller_key,
      network: this.configService.get<string>('STELLAR_NETWORK') || 'testnet',
    });

    // 1. Validar que el seller esté registrado on-chain
    await this.validateSellerRegistration(initDto.seller_key, this.configService.get<string>('STELLAR_NETWORK') || 'testnet');

    // 2. Validar campos según el tipo de escrow
    this.validateEscrowPayload(initDto);

    try {
      let response;

      if (initDto.type === EscrowType.SINGLE_RELEASE) {
        response = await this.deploySingleReleaseEscrowInternal({
          network: this.configService.get<string>('STELLAR_NETWORK') || 'testnet',
          service_provider: initDto.seller_key,
          approver: initDto.approver,
          receiver: initDto.receiver,
          dispute_resolver: initDto.dispute_resolver,
          total_amount: initDto.total_amount,
          asset: initDto.asset,
          asset_issuer: initDto.asset_issuer,
          title: initDto.title,
          description: initDto.description,
          platform_fee: initDto.platform_fee,
          platform_fee_receiver: initDto.platform_fee_receiver,
        });
      } else {
        response = await this.deployMultiReleaseEscrowInternal({
          network: this.configService.get<string>('STELLAR_NETWORK') || 'testnet',
          service_provider: initDto.seller_key,
          approver: initDto.approver,
          receiver: initDto.receiver,
          dispute_resolver: initDto.dispute_resolver,
          milestones: initDto.milestones,
          asset: initDto.asset,
          asset_issuer: initDto.asset_issuer,
          title: initDto.title,
          description: initDto.description,
          platform_fee: initDto.platform_fee,
          platform_fee_receiver: initDto.platform_fee_receiver,
        });
      }

      this.logger.log('Escrow initialized successfully', {
        contractId: response.contract_id,
        type: initDto.type,
      });

      return {
        success: true,
        contract_id: response.contract_id,
        unsigned_xdr: response.unsigned_xdr,
        message: 'Escrow initialized successfully',
      };

    } catch (error) {
      this.logger.error('Failed to initialize escrow', error);
      throw error;
    }
  }

  async sendSignedTransaction(transactionDto: SendSignedTransactionDto): Promise<{
    success: boolean;
    transaction_hash?: string;
    message?: string;
  }> {
    this.logger.log('Sending signed transaction', {
      network: transactionDto.network,
      contractId: transactionDto.contract_id,
    });

    // Validar que el XDR no esté vacío
    if (!transactionDto.signed_xdr || transactionDto.signed_xdr.trim() === '') {
      throw new BadRequestException('Missing signature: signed_xdr is required and cannot be empty');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/helper/send-transaction`, {
          network: transactionDto.network,
          signed_xdr: transactionDto.signed_xdr,
        }, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Transaction sent successfully', {
        transactionHash: response.data.transaction_hash,
        contractId: transactionDto.contract_id,
      });

      return {
        success: true,
        transaction_hash: response.data.transaction_hash,
        message: 'Transaction sent successfully',
      };

    } catch (error) {
      this.logger.error('Failed to send transaction', error);
      this.handleApiError(error, 'Send Signed Transaction');
    }
  }

  // =====================
  // DEPLOYMENT METHODS
  // =====================

  async deploySingleReleaseEscrow(deployDto: DeploySingleReleaseEscrowDto): Promise<any> {
    this.logger.log('Deploying single release escrow');
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/deployer/single-release`, deployDto, {
          headers: this.apiHeaders,
        })
      );
      
      this.logger.log('Single release escrow deployed successfully', {
        contractId: response.data.contract_id,
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to deploy single release escrow', error);
      this.handleApiError(error, 'Deploy Single Release Escrow');
    }
  }

  async deployMultiReleaseEscrow(deployDto: DeployMultiReleaseEscrowDto): Promise<any> {
    this.logger.log('Deploying multi release escrow');
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/deployer/multi-release`, deployDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Multi release escrow deployed successfully', {
        contractId: response.data.contract_id,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to deploy multi release escrow', error);
      this.handleApiError(error, 'Deploy Multi Release Escrow');
    }
  }

  // =====================
  // FUNDING METHODS
  // =====================

  async fundEscrow(escrowType: EscrowType, fundDto: FundEscrowDto): Promise<any> {
    this.logger.log(`Funding ${escrowType} escrow`, { contractId: fundDto.contract_id });
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/fund-escrow`, fundDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Escrow funded successfully', {
        contractId: fundDto.contract_id,
        amount: fundDto.amount,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fund escrow', error);
      this.handleApiError(error, 'Fund Escrow');
    }
  }

  // =====================
  // QUERY METHODS
  // =====================

  async getEscrowDetails(escrowType: EscrowType, getDto: GetEscrowDto): Promise<any> {
    this.logger.log(`Getting ${escrowType} escrow details`, { contractId: getDto.contract_id });
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/get-escrow`, getDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Escrow details retrieved successfully', {
        contractId: getDto.contract_id,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get escrow details', error);
      this.handleApiError(error, 'Get Escrow Details');
    }
  }

  async getMultipleEscrowBalance(contractIds: string[], network: string): Promise<any> {
    this.logger.log('Getting multiple escrow balances');
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/helper/get-multiple-escrow-balance`, {
          contract_ids: contractIds,
          network,
        }, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Multiple escrow balances retrieved successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get multiple escrow balances', error);
      this.handleApiError(error, 'Get Multiple Escrow Balance');
    }
  }

  // =====================
  // MILESTONE METHODS
  // =====================

  async approveMilestone(escrowType: EscrowType, approveDto: ApproveMilestoneDto): Promise<any> {
    this.logger.log(`Approving milestone for ${escrowType} escrow`, {
      contractId: approveDto.contract_id,
      milestoneIndex: approveDto.milestone_index,
    });
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/approve-milestone`, approveDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Milestone approved successfully', {
        contractId: approveDto.contract_id,
        milestoneIndex: approveDto.milestone_index,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to approve milestone', error);
      this.handleApiError(error, 'Approve Milestone');
    }
  }

  async changeMilestoneStatus(escrowType: EscrowType, statusDto: any): Promise<any> {
    this.logger.log(`Changing milestone status for ${escrowType} escrow`);
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/change-milestone-status`, statusDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Milestone status changed successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to change milestone status', error);
      this.handleApiError(error, 'Change Milestone Status');
    }
  }

  // =====================
  // FUND RELEASE METHODS
  // =====================

  async releaseFunds(escrowType: EscrowType, releaseDto: ReleaseFundsDto): Promise<any> {
    this.logger.log(`Releasing funds for ${escrowType} escrow`, {
      contractId: releaseDto.contract_id,
    });

    try {
      const endpoint = escrowType === EscrowType.SINGLE_RELEASE ? 'release-funds' : 'release-funds';
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/${endpoint}`, releaseDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Funds released successfully', {
        contractId: releaseDto.contract_id,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to release funds', error);
      this.handleApiError(error, 'Release Funds');
    }
  }

  async releaseMilestoneFunds(releaseDto: ReleaseMilestoneFundsDto): Promise<any> {
    this.logger.log('Releasing milestone funds', {
      contractId: releaseDto.contract_id,
      milestoneIndex: releaseDto.milestone_index,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/multi-release/release-milestone-funds`, releaseDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Milestone funds released successfully', {
        contractId: releaseDto.contract_id,
        milestoneIndex: releaseDto.milestone_index,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to release milestone funds', error);
      this.handleApiError(error, 'Release Milestone Funds');
    }
  }

  // =====================
  // DISPUTE METHODS
  // =====================

  async disputeEscrow(escrowType: EscrowType, disputeDto: DisputeEscrowDto): Promise<any> {
    this.logger.log(`Creating dispute for ${escrowType} escrow`, {
      contractId: disputeDto.contract_id,
      reason: disputeDto.reason,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/dispute-escrow`, disputeDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Dispute created successfully', {
        contractId: disputeDto.contract_id,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create dispute', error);
      this.handleApiError(error, 'Dispute Escrow');
    }
  }

  async resolveDispute(escrowType: EscrowType, resolveDto: ResolveDisputeDto): Promise<any> {
    this.logger.log(`Resolving dispute for ${escrowType} escrow`, {
      contractId: resolveDto.contract_id,
      approveRelease: resolveDto.approve_release,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/resolve-dispute`, resolveDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Dispute resolved successfully', {
        contractId: resolveDto.contract_id,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to resolve dispute', error);
      this.handleApiError(error, 'Resolve Dispute');
    }
  }

  async disputeMilestone(disputeDto: any): Promise<any> {
    this.logger.log('Creating milestone dispute');
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/multi-release/dispute-milestone`, disputeDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Milestone dispute created successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create milestone dispute', error);
      this.handleApiError(error, 'Dispute Milestone');
    }
  }

  async resolveMilestoneDispute(resolveDto: any): Promise<any> {
    this.logger.log('Resolving milestone dispute');
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/multi-release/resolve-milestone-dispute`, resolveDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Milestone dispute resolved successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to resolve milestone dispute', error);
      this.handleApiError(error, 'Resolve Milestone Dispute');
    }
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async updateEscrow(escrowType: EscrowType, updateDto: UpdateEscrowDto): Promise<any> {
    this.logger.log(`Updating ${escrowType} escrow`, {
      contractId: updateDto.contract_id,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/escrow/${escrowType}/update-escrow`, updateDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Escrow updated successfully', {
        contractId: updateDto.contract_id,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update escrow', error);
      this.handleApiError(error, 'Update Escrow');
    }
  }

  // =====================
  // HELPER METHODS
  // =====================

  async setTrustline(trustlineDto: SetTrustlineDto): Promise<any> {
    this.logger.log('Setting trustline', {
      account: trustlineDto.account_key,
      asset: trustlineDto.asset,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/helper/set-trustline`, trustlineDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Trustline set successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to set trustline', error);
      this.handleApiError(error, 'Set Trustline');
    }
  }

  async sendTransaction(transactionDto: SendTransactionDto): Promise<any> {
    this.logger.log('Sending transaction to Stellar network', {
      network: this.configService.get<string>('STELLAR_NETWORK') || 'testnet',
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/helper/send-transaction`, transactionDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Transaction sent successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send transaction', error);
      this.handleApiError(error, 'Send Transaction');
    }
  }

  async getEscrowsBySigner(queryDto: GetEscrowsBySignerDto): Promise<any> {
    this.logger.log('Getting escrows by signer', {
      signer: queryDto.signer,
      network: queryDto.network,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/helper/get-escrows-by-signer`, queryDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Escrows by signer retrieved successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get escrows by signer', error);
      this.handleApiError(error, 'Get Escrows By Signer');
    }
  }

  async getEscrowsByRole(queryDto: GetEscrowsByRoleDto): Promise<any> {
    this.logger.log('Getting escrows by role', {
      userKey: queryDto.user_key,
      role: queryDto.role,
      network: queryDto.network,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/helper/get-escrows-by-role`, queryDto, {
          headers: this.apiHeaders,
        })
      );

      this.logger.log('Escrows by role retrieved successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get escrows by role', error);
      this.handleApiError(error, 'Get Escrows By Role');
    }
  }

  // =====================
  // VALIDATION METHODS
  // =====================

  private async validateSellerRegistration(sellerKey: string, network: string): Promise<void> {
    this.logger.log('Validating seller registration', { seller: sellerKey, network });

    try {
      // Obtener escrows del seller para verificar si está registrado
      const escrows = await this.getEscrowsBySigner({
        network: network as any,
        signer: sellerKey,
        page: 1,
        limit: 1,
      });

      // Si es la primera vez, podríamos también verificar la cuenta en Stellar
      // Por ahora, si no hay error en la consulta, consideramos que está registrado
      this.logger.log('Seller validation completed', { seller: sellerKey });

    } catch (error) {
      // Si falla la consulta, podría ser que no esté registrado o sea un error de red
      this.logger.warn('Seller validation warning', { seller: sellerKey, error: error.message });
      
      // Dependiendo de la respuesta de la API, podrías querer fallar o continuar
      // Por ahora, solo logueamos la advertencia
    }
  }

  private validateEscrowPayload(initDto: InitializeEscrowDto): void {
    if (initDto.type === EscrowType.SINGLE_RELEASE) {
      if (!initDto.total_amount) {
        throw new BadRequestException('total_amount is required for single-release escrow');
      }
      if (initDto.milestones && initDto.milestones.length > 0) {
        throw new BadRequestException('milestones should not be provided for single-release escrow');
      }
    } else if (initDto.type === EscrowType.MULTI_RELEASE) {
      if (!initDto.milestones || initDto.milestones.length === 0) {
        throw new BadRequestException('milestones are required for multi-release escrow');
      }
      if (initDto.total_amount) {
        throw new BadRequestException('total_amount should not be provided for multi-release escrow');
      }
    }

    // Validar que todas las claves sean diferentes
    const keys = [initDto.seller_key, initDto.approver, initDto.receiver, initDto.dispute_resolver];
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      throw new BadRequestException('All participant keys must be unique');
    }
  }

  // =====================
  // INTERNAL DEPLOY METHODS
  // =====================

  private async deploySingleReleaseEscrowInternal(deployDto: any): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/deployer/single-release`, deployDto, {
        headers: this.apiHeaders,
      })
    );
    return response.data;
  }

  private async deployMultiReleaseEscrowInternal(deployDto: any): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/deployer/multi-release`, deployDto, {
        headers: this.apiHeaders,
      })
    );
    return response.data;
  }

  // =====================
  // UTILITY METHODS
  // =====================

  /**
   * Verifica el estado de la API de Trustless Work
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Nota: Ajusta este endpoint si Trustless Work tiene un endpoint de health
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          headers: this.apiHeaders,
          timeout: 5000,
        })
      );
      
      this.logger.log('Trustless Work API is healthy');
      return response.status === 200;
    } catch (error) {
      this.logger.warn('Trustless Work API health check failed', error.message);
      return false;
    }
  }

  /**
   * Obtiene la configuración actual de la API
   */
  getApiConfiguration() {
    return {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.configService.get<string>('TRUSTLESS_WORK_API_KEY'),
      timeout: 10000,
    };
  }

  // =====================
  // ERROR HANDLING
  // =====================

  private handleApiError(error: any, operation: string): never {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.response?.data?.message || error.message || `Trustless Work API Error in ${operation}`;
    const details = error.response?.data || {};
    
    this.logger.error(`API Error in ${operation}`, {
      status,
      message,
      details,
      url: error.config?.url,
    });

    // Mapear códigos de estado específicos
    let mappedStatus = status;
    if (status === 429) {
      mappedStatus = HttpStatus.TOO_MANY_REQUESTS;
    } else if (status >= 400 && status < 500) {
      mappedStatus = HttpStatus.BAD_REQUEST;
    } else if (status >= 500) {
      mappedStatus = HttpStatus.SERVICE_UNAVAILABLE;
    }

    throw new HttpException(
      {
        statusCode: mappedStatus,
        message,
        error: `Trustless Work API Error - ${operation}`,
        details,
        timestamp: new Date().toISOString(),
      },
      mappedStatus,
    );
  }
}