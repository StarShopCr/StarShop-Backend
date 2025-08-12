import { AuthService } from '../services/auth.service';
import { UserService } from '../../users/services/user.service';
import { RoleService } from '../services/role.service';
import { JwtService } from '@nestjs/jwt';
import { Keypair } from 'stellar-sdk';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import { User } from '../../users/entities/user.entity';
import { Role as UserRoleEnum } from '../../../types/role';

// Mock dependencies
jest.mock('../../users/services/user.service');
jest.mock('../services/role.service');
jest.mock('@nestjs/jwt');
jest.mock('stellar-sdk');
jest.mock('jsonwebtoken', () => ({ sign: jest.fn().mockReturnValue('mock.jwt.token') }));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let roleService: jest.Mocked<RoleService>;

  const mockWalletAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const mockMessage =
    'StarShop Authentication Challenge - GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF - 1234567890';
  const mockSignature = 'mockSignatureBase64';

  beforeEach(() => {
    userService = {
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      getUsers: jest.fn(),
      getUserOrders: jest.fn(),
      getUserWishlist: jest.fn(),
    } as any;

    jwtService = { sign: jest.fn().mockReturnValue('mock.jwt.token'), verify: jest.fn() } as any;

    roleService = { findByName: jest.fn(), createRole: jest.fn(), deleteRole: jest.fn() } as any;

    // Mock repositories
    const mockUserRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } as any;
    const mockRoleRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } as any;
    const mockUserRoleRepository = { create: jest.fn(), save: jest.fn() } as any;
    const mockStoreService = { createDefaultStore: jest.fn() } as any;

    authService = new AuthService(
      mockUserRepository,
      mockRoleRepository,
      mockUserRoleRepository,
      userService,
      jwtService,
      roleService,
      mockStoreService
    );
  });

  describe('generateChallenge', () => {
    it('should generate a challenge message with wallet address and timestamp', () => {
      const challenge = authService.generateChallenge(mockWalletAddress);

      expect(challenge).toContain('StarShop Authentication Challenge');
      expect(challenge).toContain(mockWalletAddress);
      expect(challenge).toMatch(/\d+/); // Should contain timestamp
    });
  });

  describe('verifyStellarSignature', () => {
    it('should return true for valid signature', () => {
      const mockKeypair = { verify: jest.fn().mockReturnValue(true) };
      (Keypair.fromPublicKey as jest.Mock).mockReturnValue(mockKeypair);

      const result = authService.verifyStellarSignature(
        mockWalletAddress,
        mockMessage,
        mockSignature
      );

      expect(result).toBe(true);
      expect(Keypair.fromPublicKey).toHaveBeenCalledWith(mockWalletAddress);
      expect(mockKeypair.verify).toHaveBeenCalledWith(
        Buffer.from(mockMessage, 'utf8'),
        Buffer.from(mockSignature, 'base64')
      );
    });

    it('should return false for invalid signature', () => {
      const mockKeypair = { verify: jest.fn().mockReturnValue(false) };
      (Keypair.fromPublicKey as jest.Mock).mockReturnValue(mockKeypair);

      const result = authService.verifyStellarSignature(
        mockWalletAddress,
        mockMessage,
        mockSignature
      );

      expect(result).toBe(false);
    });

    it('should return false when Keypair.fromPublicKey throws', () => {
      (Keypair.fromPublicKey as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid public key');
      });

      const result = authService.verifyStellarSignature(
        mockWalletAddress,
        mockMessage,
        mockSignature
      );

      expect(result).toBe(false);
    });
  });

  describe('loginWithWallet', () => {
    const mockUser: Partial<User> = {
      id: 1,
      walletAddress: mockWalletAddress,
      name: 'Test User',
      email: 'test@example.com',
      location: 'Test City',
      country: 'Test Country',
      buyerData: {},
      sellerData: null,
      userRoles: [{ role: { name: 'buyer' } }] as any,
    };

    beforeEach(() => {
      // Mock successful signature verification
      const mockKeypair = { verify: jest.fn().mockReturnValue(true) };
      (Keypair.fromPublicKey as jest.Mock).mockReturnValue(mockKeypair);
    });

    it('should successfully login with valid wallet and signature', async () => {
      // Mock user repository findOne
      const mockUserRepository = { findOne: jest.fn().mockResolvedValue(mockUser) };
      (authService as any).userRepository = mockUserRepository;

      const result = await authService.loginWithWallet(mockWalletAddress);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('mock.jwt.token');
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const mockUserRepository = { findOne: jest.fn().mockResolvedValue(null) };
      (authService as any).userRepository = mockUserRepository;

      await expect(authService.loginWithWallet(mockWalletAddress)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('registerWithWallet', () => {
    const mockNewUser: Partial<User> = {
      id: 1,
      walletAddress: mockWalletAddress,
      name: 'New User',
      email: 'new@example.com',
      location: 'Test City',
      country: 'Test Country',
      buyerData: {},
      sellerData: null,
      userRoles: [{ role: { name: 'buyer' } }] as any,
    };

    beforeEach(() => {
      // Mock successful signature verification
      const mockKeypair = { verify: jest.fn().mockReturnValue(true) };
      (Keypair.fromPublicKey as jest.Mock).mockReturnValue(mockKeypair);
    });

    it('should successfully register new user with valid wallet and signature', async () => {
      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(null), // No existing user
        create: jest.fn().mockReturnValue(mockNewUser),
        save: jest.fn().mockResolvedValue(mockNewUser),
      };
      (authService as any).userRepository = mockUserRepository;

      const result = await authService.registerWithWallet({
        walletAddress: mockWalletAddress,
        role: UserRoleEnum.BUYER,
        name: 'New User',
        email: 'new@example.com',
      });

      expect(result.user).toEqual(mockNewUser);
      expect(result.token).toBe('mock.jwt.token');
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw BadRequestError when wallet address already registered', async () => {
      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(mockNewUser), // Existing user
      };
      (authService as any).userRepository = mockUserRepository;

      await expect(
        authService.registerWithWallet({
          walletAddress: mockWalletAddress,
          role: UserRoleEnum.BUYER,
          name: 'New User',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw UnauthorizedError for invalid signature', async () => {
      const mockKeypair = { verify: jest.fn().mockReturnValue(false) };
      (Keypair.fromPublicKey as jest.Mock).mockReturnValue(mockKeypair);

      await expect(
        authService.registerWithWallet({
          walletAddress: mockWalletAddress,
          role: UserRoleEnum.BUYER,
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser: Partial<User> = { id: 1, walletAddress: mockWalletAddress };
      const mockUserRepository = { findOne: jest.fn().mockResolvedValue(mockUser) };
      (authService as any).userRepository = mockUserRepository;

      const result = await authService.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['userRoles', 'userRoles.role'],
      });
    });

    it('should throw BadRequestError when user not found', async () => {
      const mockUserRepository = { findOne: jest.fn().mockResolvedValue(null) };
      (authService as any).userRepository = mockUserRepository;

      await expect(authService.getUserById('1')).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateUser', () => {
    it('should successfully update user information', async () => {
      const mockUser: Partial<User> = { id: 1, walletAddress: mockWalletAddress, name: 'Old Name' };
      const mockUpdatedUser: Partial<User> = { ...mockUser, name: 'New Name' };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      (authService as any).userRepository = mockUserRepository;

      userService.getUserById.mockResolvedValue(mockUpdatedUser as User);

      const result = await authService.updateUser(1, { name: 'New Name' });

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUpdatedUser);
    });

    it('should throw BadRequestError when user not found', async () => {
      const mockUserRepository = { findOne: jest.fn().mockResolvedValue(null) };
      (authService as any).userRepository = mockUserRepository;

      await expect(authService.updateUser(1, { name: 'New Name' })).rejects.toThrow(
        BadRequestError
      );
    });
  });
});
