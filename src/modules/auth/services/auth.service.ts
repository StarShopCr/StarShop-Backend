import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/services/user.service';
import { RoleService } from './role.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import { sign } from 'jsonwebtoken';
import { config } from '../../../config';
import { Keypair } from 'stellar-sdk';

type RoleName = 'buyer' | 'seller' | 'admin';

@Injectable()
export class AuthService {
  private readonly CHALLENGE_MESSAGE = 'StarShop Authentication Challenge';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService
  ) {}

  /**
   * Generate a challenge message for wallet authentication
   */
  generateChallenge(walletAddress: string): string {
    const timestamp = Date.now();
    return `${this.CHALLENGE_MESSAGE} - ${walletAddress} - ${timestamp}`;
  }

  /**
   * Verify Stellar signature
   */
  verifyStellarSignature(walletAddress: string, message: string, signature: string): boolean {
    try {
      // In development mode, allow test signatures
      if (
        process.env.NODE_ENV === 'development' &&
        signature === 'base64-encoded-signature-string-here'
      ) {
        console.log('Development mode: Bypassing signature verification for testing');
        return true;
      }

      const keypair = Keypair.fromPublicKey(walletAddress);
      const messageBuffer = Buffer.from(message, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');

      return keypair.verify(messageBuffer, signatureBuffer);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Register new user with Stellar wallet (no signature required)
   */
  async registerWithWallet(data: {
    walletAddress: string;
    role: 'buyer' | 'seller';
    name?: string;
    email?: string;
    location?: string;
    country?: string;
    buyerData?: any;
    sellerData?: any;
  }): Promise<{ user: User; token: string; expiresIn: number }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { walletAddress: data.walletAddress },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (existingUser) {
      // Update existing user instead of throwing error
      existingUser.name = data.name || existingUser.name;
      existingUser.email = data.email || existingUser.email;
      existingUser.location = data.location || existingUser.location;
      existingUser.country = data.country || existingUser.country;
      existingUser.buyerData = data.buyerData || existingUser.buyerData;
      existingUser.sellerData = data.sellerData || existingUser.sellerData;

      const updatedUser = await this.userRepository.save(existingUser);

      // Generate JWT token
      const role = updatedUser.userRoles?.[0]?.role?.name || 'buyer';
      const token = sign(
        { id: updatedUser.id, walletAddress: updatedUser.walletAddress, role },
        config.jwtSecret,
        {
          expiresIn: '1h',
        }
      );

      return { user: updatedUser, token, expiresIn: 3600 };
    }

    // Create new user
    const user = this.userRepository.create({
      walletAddress: data.walletAddress,
      name: data.name,
      email: data.email,
      location: data.location,
      country: data.country,
      buyerData: data.buyerData,
      sellerData: data.sellerData,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign user role to user_roles table
    const userRole = await this.roleRepository.findOne({ where: { name: data.role } });
    if (userRole) {
      const userRoleEntity = this.userRoleRepository.create({
        userId: savedUser.id,
        roleId: userRole.id,
        user: savedUser,
        role: userRole,
      });
      await this.userRoleRepository.save(userRoleEntity);
    }

    // Generate JWT token
    const token = sign(
      { id: savedUser.id, walletAddress: savedUser.walletAddress, role: data.role },
      config.jwtSecret,
      {
        expiresIn: '1h',
      }
    );

    return { user: savedUser, token, expiresIn: 3600 };
  }

  /**
   * Login with Stellar wallet (no signature required)
   */
  async loginWithWallet(
    walletAddress: string
  ): Promise<{ user: User; token: string; expiresIn: number }> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { walletAddress },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new UnauthorizedError('User not found. Please register first.');
    }

    // Generate JWT token
    const role = user.userRoles?.[0]?.role?.name || 'buyer';
    const token = sign({ id: user.id, walletAddress: user.walletAddress, role }, config.jwtSecret, {
      expiresIn: '1h',
    });

    return { user, token, expiresIn: 3600 };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: Number(id) },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    return user;
  }

  /**
   * Update user information
   */
  async updateUser(userId: number, updateData: { 
    name?: string; 
    email?: string; 
    location?: string; 
    country?: string; 
    buyerData?: any; 
    sellerData?: any; 
  }): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Update user data
    Object.assign(user, updateData);
    await this.userRepository.save(user);

    return this.getUserById(String(userId));
  }

  async authenticateUser(walletAddress: string): Promise<{ access_token: string }> {
    // Try to find an existing user with this wallet address
    let user = await this.userRepository.findOne({
      where: { walletAddress },
      relations: ['userRoles', 'userRoles.role'],
    });

    // If no user exists, create a new one with default 'buyer' role
    if (!user) {
      user = this.userRepository.create({ walletAddress });
      await this.userRepository.save(user);

      // Get the buyer role
      const buyerRole = await this.roleRepository.findOne({ where: { name: 'buyer' } });
      if (!buyerRole) {
        throw new Error('Default buyer role not found');
      }

      // Create user role relationship
      const userRole = this.userRoleRepository.create({
        userId: user.id,
        roleId: buyerRole.id,
        user,
        role: buyerRole,
      });
      await this.userRoleRepository.save(userRole);

      // Reload user with relations
      user = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['userRoles', 'userRoles.role'],
      });
    }

    // Get the user's primary role (assuming first role is primary)
    const primaryRole = user.userRoles?.[0]?.role?.name || 'buyer';

    // Create a JWT token containing user information
    const payload = { sub: user.id, walletAddress: user.walletAddress, role: primaryRole };

    return { access_token: this.jwtService.sign(payload) };
  }

  async assignRole(userId: number, roleName: RoleName): Promise<User> {
    const user = await this.userService.getUserById(String(userId));
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const role = await this.roleService.findByName(roleName);
    if (!role) {
      throw new UnauthorizedException('Role not found');
    }

    // Remove existing roles
    await this.userRoleRepository.delete({ userId });

    // Create new user role relationship
    const userRole = this.userRoleRepository.create({
      userId: user.id,
      roleId: role.id,
      user,
      role,
    });
    await this.userRoleRepository.save(userRole);

    return this.userService.getUserById(String(userId));
  }

  async removeRole(userId: number): Promise<User> {
    const user = await this.userService.getUserById(String(userId));
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.userRoleRepository.delete({ userId });

    return this.userService.getUserById(String(userId));
  }
}
