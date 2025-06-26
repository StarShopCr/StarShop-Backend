import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/services/user.service';
import { RoleService } from './role.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import AppDataSource from '../../../config/ormconfig';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import { sign } from 'jsonwebtoken';
import { config } from '../../../config';
import { Keypair } from 'stellar-sdk';

type RoleName = 'buyer' | 'seller' | 'admin';

@Injectable()
export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private readonly CHALLENGE_MESSAGE = 'StarShop Authentication Challenge';

  constructor(
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
      const keypair = Keypair.fromPublicKey(walletAddress);
      const messageBuffer = Buffer.from(message, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');

      return keypair.verify(messageBuffer, signatureBuffer);
    } catch (error) {
      return false;
    }
  }

  /**
   * Register new user with Stellar wallet
   */
  async registerWithWallet(data: {
    walletAddress: string;
    signature: string;
    message: string;
    name?: string;
    email?: string;
  }): Promise<{ user: User; token: string; expiresIn: number }> {
    // Verify signature
    if (!this.verifyStellarSignature(data.walletAddress, data.message, data.signature)) {
      throw new UnauthorizedError('Invalid signature');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { walletAddress: data.walletAddress },
    });

    if (existingUser) {
      throw new BadRequestError('Wallet address already registered');
    }

    // Create new user
    const user = this.userRepository.create({
      walletAddress: data.walletAddress,
      name: data.name,
      email: data.email,
      userRoles: [{ role: { name: 'buyer' as const } }],
    });

    await this.userRepository.save(user);

    // Generate JWT token
    const role = user.userRoles?.[0]?.role?.name || 'buyer';
    const token = sign({ id: user.id, walletAddress: user.walletAddress, role }, config.jwtSecret, {
      expiresIn: '1h',
    });

    return { user, token, expiresIn: 3600 };
  }

  /**
   * Login with Stellar wallet
   */
  async loginWithWallet(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<{ user: User; token: string; expiresIn: number }> {
    // Verify signature
    if (!this.verifyStellarSignature(walletAddress, message, signature)) {
      throw new UnauthorizedError('Invalid signature');
    }

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
  async updateUser(userId: number, updateData: { name?: string; email?: string }): Promise<User> {
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
    // Get access to the User table in the database
    const userRepository = AppDataSource.getRepository(User);
    const userRoleRepository = AppDataSource.getRepository(UserRole);
    const roleRepository = AppDataSource.getRepository(Role);

    // Try to find an existing user with this wallet address
    let user = await userRepository.findOne({
      where: { walletAddress },
      relations: ['userRoles', 'userRoles.role'],
    });

    // If no user exists, create a new one with default 'buyer' role
    if (!user) {
      user = userRepository.create({ walletAddress });
      await userRepository.save(user);

      // Get the buyer role
      const buyerRole = await roleRepository.findOne({ where: { name: 'buyer' } });
      if (!buyerRole) {
        throw new Error('Default buyer role not found');
      }

      // Create user role relationship
      const userRole = userRoleRepository.create({
        userId: user.id,
        roleId: buyerRole.id,
        user,
        role: buyerRole,
      });
      await userRoleRepository.save(userRole);

      // Reload user with relations
      user = await userRepository.findOne({
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

    const userRoleRepository = AppDataSource.getRepository(UserRole);

    // Remove existing roles
    await userRoleRepository.delete({ userId });

    // Create new user role relationship
    const userRole = userRoleRepository.create({ userId: user.id, roleId: role.id, user, role });
    await userRoleRepository.save(userRole);

    return this.userService.getUserById(String(userId));
  }

  async removeRole(userId: number): Promise<User> {
    const user = await this.userService.getUserById(String(userId));
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRoleRepository = AppDataSource.getRepository(UserRole);
    await userRoleRepository.delete({ userId });

    return this.userService.getUserById(String(userId));
  }
}
