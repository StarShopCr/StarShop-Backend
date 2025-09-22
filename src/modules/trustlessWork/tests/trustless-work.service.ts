import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TrustlessWorkService } from '../services/trustless-work.service';
import { of, throwError } from 'rxjs';
import { ApproveMilestoneDto, DeploySingleReleaseEscrowDto, EscrowType, FundEscrowDto, NetworkType } from '../dtos/trustless-work.dto';

describe('TrustlessWorkService', () => {
  let service: TrustlessWorkService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.trustlesswork.com'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustlessWorkService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TrustlessWorkService>(TrustlessWorkService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deploySingleReleaseEscrow', () => {
    it('should deploy a single release escrow successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          contract_id: 'CA123...',
          unsigned_xdr: 'AAAAAG...',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const deployDto = {
        network: 'testnet' as const,
        service_provider: 'GA123...',
        approver: 'GB456...',
        receiver: 'GC789...',
        dispute_resolver: 'GD012...',
        total_amount: '1000',
        asset: 'USDC',
        title: 'Test Escrow',
        description: 'Test Description',
      };

      const result = await service.deploySingleReleaseEscrow(deployDto);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.post).toHaveBeenCalledWith('/deployer/single-release', deployDto);
    });

    it('should handle deployment errors', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('API Error')));

      const deployDto: DeploySingleReleaseEscrowDto = {
        service_provider: 'GA123...',
        approver: 'GB456...',
        receiver: 'GC789...',
        dispute_resolver: 'GD012...',
        total_amount: '1000',
        asset: 'USDC',
        title: 'Test Escrow',
        description: 'Test Description',
      };

      await expect(service.deploySingleReleaseEscrow(deployDto)).rejects.toThrow('API Error');
    });
  });

  describe('fundEscrow', () => {
    it('should fund an escrow successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          unsigned_xdr: 'AAAAAG...',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const fundDto: FundEscrowDto = {
        contract_id: 'CA123...',
        funder_key: 'GA123...',
        amount: '1000',
      };

      const result = await service.fundEscrow(EscrowType.SINGLE_RELEASE, fundDto);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.post).toHaveBeenCalledWith('/escrow/single-release/fund-escrow', fundDto);
    });
  });

  describe('getEscrowDetails', () => {
    it('should retrieve escrow details successfully', async () => {
      const mockResponse = {
        data: {
          contract_id: 'CA123...',
          status: 'active',
          balance: '1000',
          milestones: [],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const queryDto = {
        network: NetworkType.TESTNET,
        contract_id: 'CA123...',
      };

      const result = await service.getEscrowDetails(EscrowType.SINGLE_RELEASE, queryDto);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.post).toHaveBeenCalledWith('/escrow/single-release/get-escrow', queryDto);
    });
  });

  describe('approveMilestone', () => {
    it('should approve a milestone successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          unsigned_xdr: 'AAAAAG...',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const approveDto: ApproveMilestoneDto = {
        contract_id: 'CA123...',
        approver_key: 'GB456...',
        milestone_index: 0,
      };

      const result = await service.approveMilestone(EscrowType.MULTI_RELEASE, approveDto);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.post).toHaveBeenCalledWith('/escrow/multi-release/approve-milestone', approveDto);
    });
  });

  describe('releaseFunds', () => {
    it('should release funds for single release escrow', async () => {
      const mockResponse = {
        data: {
          success: true,
          unsigned_xdr: 'AAAAAG...',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const releaseDto = {
        network: 'testnet' as const,
        contract_id: 'CA123...',
        releaser_key: 'GA123...',
      };

      const result = await service.releaseFunds(EscrowType.SINGLE_RELEASE, releaseDto);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.post).toHaveBeenCalledWith('/escrow/single-release/release-funds', releaseDto);
    });
  });

  describe('disputeEscrow', () => {
    it('should create a dispute successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          unsigned_xdr: 'AAAAAG...',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const disputeDto = {
        network: 'testnet' as const,
        contract_id: 'CA123...',
        disputer_key: 'GA123...',
        reason: 'Work not completed as agreed',
      };

      const result = await service.disputeEscrow(EscrowType.SINGLE_RELEASE, disputeDto);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.post).toHaveBeenCalledWith('/escrow/single-release/dispute-escrow', disputeDto);
    });
  });
});