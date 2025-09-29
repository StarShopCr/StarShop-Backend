import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { SellerService } from '../services/seller.service';
import { User } from '../../users/entities/user.entity';
import { BuildRegisterDto } from '../dto/build-register.dto';
import { SubmitRegisterDto } from '../dto/submit-register.dto';

describe('SellerService', () => {
  let service: SellerService;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 1,
    walletAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    payoutWallet: null,
    sellerOnchainRegistered: false,
    userRoles: [
      {
        role: { name: 'seller' }
      }
    ]
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<SellerService>(SellerService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildRegister', () => {
    const buildRegisterDto: BuildRegisterDto = {
      payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
    };

    it('should build unsigned XDR successfully', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call for user lookup
        .mockResolvedValueOnce(null); // Second call for payout wallet check

      const result = await service.buildRegister(1, buildRegisterDto);

      expect(result).toHaveProperty('unsignedXdr');
      expect(result).toHaveProperty('contractAddress');
      expect(typeof result.unsignedXdr).toBe('string');
      expect(typeof result.contractAddress).toBe('string');
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.buildRegister(1, buildRegisterDto))
        .rejects.toThrow(BadRequestException);
      
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['userRoles', 'userRoles.role'],
      });
    });

    it('should throw BadRequestException when user is not a seller', async () => {
      const nonSellerUser = {
        ...mockUser,
        userRoles: [{ role: { name: 'buyer' } }]
      };
      mockUserRepository.findOne.mockResolvedValueOnce(nonSellerUser);

      await expect(service.buildRegister(1, buildRegisterDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already has payout wallet', async () => {
      const userWithWallet = {
        ...mockUser,
        payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(userWithWallet);

      await expect(service.buildRegister(1, buildRegisterDto))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when payout wallet already used', async () => {
      const existingUserWithWallet = {
        id: 2,
        payoutWallet: buildRegisterDto.payoutWallet,
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // User lookup
        .mockResolvedValueOnce(existingUserWithWallet); // Payout wallet check

      await expect(service.buildRegister(1, buildRegisterDto))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('submitRegister', () => {
    const submitRegisterDto: SubmitRegisterDto = {
      signedXdr: 'AAAAAgAAAABqjgAAAAAA...',
    };

    it('should submit registration successfully', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUserRepository.update.mockResolvedValueOnce({ affected: 1 });

      const result = await service.submitRegister(1, submitRegisterDto);

      expect(result).toHaveProperty('transactionHash');
      expect(result).toHaveProperty('contractId');
      expect(result).toHaveProperty('payoutWallet');
      expect(result.registered).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        payoutWallet: expect.any(String),
        sellerOnchainRegistered: true,
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.submitRegister(1, submitRegisterDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user is not a seller', async () => {
      const nonSellerUser = {
        ...mockUser,
        userRoles: [{ role: { name: 'buyer' } }]
      };
      mockUserRepository.findOne.mockResolvedValueOnce(nonSellerUser);

      await expect(service.submitRegister(1, submitRegisterDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid signed XDR', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      const invalidDto = { signedXdr: 'invalid' };

      await expect(service.submitRegister(1, invalidDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getRegistrationStatus', () => {
    it('should return registration status', async () => {
      const registeredUser = {
        ...mockUser,
        payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
        sellerOnchainRegistered: true,
      };
      mockUserRepository.findOne.mockResolvedValueOnce(registeredUser);

      const result = await service.getRegistrationStatus(1);

      expect(result.isRegistered).toBe(true);
      expect(result.payoutWallet).toBe(registeredUser.payoutWallet);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getRegistrationStatus(1))
        .rejects.toThrow(BadRequestException);
    });
  });
});
