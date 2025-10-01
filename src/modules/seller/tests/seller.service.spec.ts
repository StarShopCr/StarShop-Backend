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

  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
  
  const mockUser = {
    id: TEST_USER_ID,
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

      const result = await service.buildRegister(TEST_USER_ID, buildRegisterDto);

      expect(result).toHaveProperty('unsignedXdr');
      expect(result).toHaveProperty('contractAddress');
      expect(typeof result.unsignedXdr).toBe('string');
      expect(typeof result.contractAddress).toBe('string');
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.buildRegister(TEST_USER_ID, buildRegisterDto))
        .rejects.toThrow(BadRequestException);
      
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: TEST_USER_ID },
        relations: ['userRoles', 'userRoles.role'],
      });
    });

    it('should throw BadRequestException when user is not a seller', async () => {
      const nonSellerUser = {
        ...mockUser,
        userRoles: [{ role: { name: 'buyer' } }]
      };
      mockUserRepository.findOne.mockResolvedValueOnce(nonSellerUser);

      await expect(service.buildRegister(TEST_USER_ID, buildRegisterDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already has payout wallet', async () => {
      const userWithWallet = {
        ...mockUser,
        payoutWallet: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(userWithWallet);

      await expect(service.buildRegister(TEST_USER_ID, buildRegisterDto))
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

      await expect(service.buildRegister(TEST_USER_ID, buildRegisterDto))
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

      const result = await service.submitRegister(TEST_USER_ID, submitRegisterDto);

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

      await expect(service.submitRegister(TEST_USER_ID, submitRegisterDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user is not a seller', async () => {
      const nonSellerUser = {
        ...mockUser,
        userRoles: [{ role: { name: 'buyer' } }]
      };
      mockUserRepository.findOne.mockResolvedValueOnce(nonSellerUser);

      await expect(service.submitRegister(TEST_USER_ID, submitRegisterDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid signed XDR', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      const invalidDto = { signedXdr: 'invalid' };

      await expect(service.submitRegister(TEST_USER_ID, invalidDto))
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

      const result = await service.getRegistrationStatus(TEST_USER_ID);

      expect(result.isRegistered).toBe(true);
      expect(result.payoutWallet).toBe(registeredUser.payoutWallet);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getRegistrationStatus(TEST_USER_ID))
        .rejects.toThrow(BadRequestException);
    });
  });
});
