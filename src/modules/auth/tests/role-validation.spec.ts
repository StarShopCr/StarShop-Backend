import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { BadRequestError } from '../../../utils/errors';
import { RegisterUserDto } from '../dto/auth.dto';
import { validate } from 'class-validator';

describe('Role Validation', () => {
  let authService: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockUserRoleRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
        {
          provide: 'UserService',
          useValue: {},
        },
        {
          provide: 'JwtService',
          useValue: {},
        },
        {
          provide: 'RoleService',
          useValue: {},
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('DTO Validation', () => {
    it('should validate buyer with only buyerData', async () => {
      const dto = new RegisterUserDto();
      dto.walletAddress = 'GD6LXK4RB6D522ECACFVUEOKPCYBGQ6SKYONMVNIUOWUAIRNLSYAOB4Q';
      dto.role = 'buyer';
      dto.buyerData = { preferences: ['electronics'] };
      dto.sellerData = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate seller with only sellerData', async () => {
      const dto = new RegisterUserDto();
      dto.walletAddress = 'GD6LXK4RB6D522ECACFVUEOKPCYBGQ6SKYONMVNIUOWUAIRNLSYAOB4Q';
      dto.role = 'seller';
      dto.sellerData = { businessName: 'Test Store' };
      dto.buyerData = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject buyer with sellerData', async () => {
      const dto = new RegisterUserDto();
      dto.walletAddress = 'GD6LXK4RB6D522ECACFVUEOKPCYBGQ6SKYONMVNIUOWUAIRNLSYAOB4Q';
      dto.role = 'buyer';
      dto.buyerData = { preferences: ['electronics'] };
      dto.sellerData = { businessName: 'Test Store' };

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'sellerData')).toBe(true);
    });

    it('should reject seller with buyerData', async () => {
      const dto = new RegisterUserDto();
      dto.walletAddress = 'GD6LXK4RB6D522ECACFVUEOKPCYBGQ6SKYONMVNIUOWUAIRNLSYAOB4Q';
      dto.role = 'seller';
      dto.sellerData = { businessName: 'Test Store' };
      dto.buyerData = { preferences: ['electronics'] };

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'buyerData')).toBe(true);
    });
  });

  describe('registerWithWallet - Role Validation', () => {
    it('should allow buyer with buyerData and no sellerData', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: 1 });
      mockUserRepository.save.mockResolvedValue({ id: 1 });
      mockRoleRepository.findOne.mockResolvedValue({ id: 1, name: 'buyer' });
      mockUserRoleRepository.create.mockReturnValue({});
      mockUserRoleRepository.save.mockResolvedValue({});

      const result = await authService.registerWithWallet({
        walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
        role: 'buyer',
        buyerData: {},
      });

      expect(result).toBeDefined();
    });

    it('should allow seller with sellerData and no buyerData', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: 1 });
      mockUserRepository.save.mockResolvedValue({ id: 1 });
      mockRoleRepository.findOne.mockResolvedValue({ id: 1, name: 'seller' });
      mockUserRoleRepository.create.mockReturnValue({});
      mockUserRoleRepository.save.mockResolvedValue({});

      const result = await authService.registerWithWallet({
        walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
        role: 'seller',
        sellerData: { businessName: 'Test Store' },
      });

      expect(result).toBeDefined();
    });

    it('should reject buyer with sellerData', async () => {
      await expect(
        authService.registerWithWallet({
          walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
          role: 'buyer',
          buyerData: {},
          sellerData: { businessName: 'Test Store' },
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should reject seller with buyerData', async () => {
      await expect(
        authService.registerWithWallet({
          walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
          role: 'seller',
          sellerData: { businessName: 'Test Store' },
          buyerData: {},
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
