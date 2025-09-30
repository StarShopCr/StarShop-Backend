import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UnauthorizedError } from '../../../utils/errors';

describe('UserController - Update API Tests', () => {
  let controller: UserController;

  const mockUserService = {
    updateUser: jest.fn(),
    getUserByWalletAddress: jest.fn(),
    getUsers: jest.fn(),
  };

  const mockAuthService = {
    registerWithWallet: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /users/update/:walletAddress', () => {
    const mockWalletAddress = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890';
    const mockUpdateDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // UUID
      walletAddress: mockWalletAddress,
      name: 'Updated Name',
      email: 'updated@example.com',
      userRoles: [{ role: { name: 'buyer' } }],
      updatedAt: new Date(),
    };

    const mockRequest = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        walletAddress: mockWalletAddress,
        role: ['buyer'],
      },
    };

    it('should successfully update user profile when user updates their own profile', async () => {
      mockUserService.updateUser.mockResolvedValue(mockUser);

      const result = await controller.updateUser(mockWalletAddress, mockUpdateDto, mockRequest as any);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(mockWalletAddress, mockUpdateDto);
      expect(result).toEqual({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          name: 'Updated Name',
          email: 'updated@example.com',
          role: 'buyer',
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should allow admin to update any user profile', async () => {
      const adminRequest = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          walletAddress: 'GBCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
          role: ['admin'],
        },
      };

      mockUserService.updateUser.mockResolvedValue(mockUser);

      const result = await controller.updateUser(mockWalletAddress, mockUpdateDto, adminRequest as any);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(mockWalletAddress, mockUpdateDto);
      expect(result.success).toBe(true);
    });

    it('should throw UnauthorizedError when user tries to update another user profile', async () => {
      const otherUserRequest = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          walletAddress: 'GBCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
          role: ['buyer'],
        },
      };

      await expect(
        controller.updateUser(mockWalletAddress, mockUpdateDto, otherUserRequest as any)
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });

    it('should handle partial updates correctly', async () => {
      const partialUpdateDto = { name: 'New Name Only' };
      const partialUser = { ...mockUser, name: 'New Name Only' };

      mockUserService.updateUser.mockResolvedValue(partialUser);

      const result = await controller.updateUser(mockWalletAddress, partialUpdateDto, mockRequest as any);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(mockWalletAddress, partialUpdateDto);
      expect(result.data.name).toBe('New Name Only');
      expect(result.data.email).toBe('updated@example.com'); // Should retain existing value
    });

    it('should handle email-only updates correctly', async () => {
      const emailOnlyUpdateDto = { email: 'newemail@example.com' };
      const emailOnlyUser = { ...mockUser, email: 'newemail@example.com' };

      mockUserService.updateUser.mockResolvedValue(emailOnlyUser);

      const result = await controller.updateUser(mockWalletAddress, emailOnlyUpdateDto, mockRequest as any);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(mockWalletAddress, emailOnlyUpdateDto);
      expect(result.data.email).toBe('newemail@example.com');
      expect(result.data.name).toBe('Updated Name'); // Should retain existing value
    });
  });

  describe('GET /users/:walletAddress', () => {
    const mockWalletAddress = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890';

    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      walletAddress: mockWalletAddress,
      name: 'Test User',
      email: 'test@example.com',
      userRoles: [{ role: { name: 'buyer' } }],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    it('should return user profile when user accesses their own profile', async () => {
      const mockRequest = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          walletAddress: mockWalletAddress,
          role: ['buyer'],
        },
      };

      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);

      const result = await controller.getUserByWalletAddress(mockWalletAddress, mockRequest as any);

      expect(mockUserService.getUserByWalletAddress).toHaveBeenCalledWith(mockWalletAddress);
      expect(result).toEqual({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          name: 'Test User',
          email: 'test@example.com',
          role: 'buyer',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should allow admin to access any user profile', async () => {
      const adminRequest = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          walletAddress: 'GBCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
          role: ['admin'],
        },
      };

      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);

      const result = await controller.getUserByWalletAddress(mockWalletAddress, adminRequest as any);

      expect(result.success).toBe(true);
      expect(result.data.walletAddress).toBe(mockWalletAddress);
    });

    it('should throw UnauthorizedError when user tries to access another user profile', async () => {
      const otherUserRequest = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          walletAddress: 'GBCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
          role: ['buyer'],
        },
      };

      await expect(
        controller.getUserByWalletAddress(mockWalletAddress, otherUserRequest as any)
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUserService.getUserByWalletAddress).not.toHaveBeenCalled();
    });
  });

  describe('UUID and walletAddress handling', () => {
    it('should not expose UUID id in API responses', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000', // UUID
        walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
        name: 'Test User',
        email: 'test@example.com',
        userRoles: [{ role: { name: 'buyer' } }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
          role: ['buyer'],
        },
      };

      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);

      const result = await controller.getUserByWalletAddress(mockUser.walletAddress, mockRequest as any);

      // Verify that UUID id is not exposed in the response
      expect(result.data).not.toHaveProperty('id');
      expect(result.data.walletAddress).toBe(mockUser.walletAddress);
    });

    it('should use walletAddress as the primary identifier in routes', () => {
      // This test verifies that the controller methods are designed to use walletAddress
      expect(controller.updateUser).toBeDefined();
      expect(controller.getUserByWalletAddress).toBeDefined();
      
      // The method signatures should use walletAddress parameter
      const updateMethod = controller.updateUser.toString();
      const getMethod = controller.getUserByWalletAddress.toString();
      
      expect(updateMethod).toContain('walletAddress');
      expect(getMethod).toContain('walletAddress');
    });
  });
});
