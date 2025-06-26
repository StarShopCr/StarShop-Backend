import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/services/user.service';
import { RoleService } from './role.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import AppDataSource from '../../../config/ormconfig';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { config } from '../../../config';
import { ethers } from 'ethers';

type RoleName = 'buyer' | 'seller' | 'admin';

@Injectable()
export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService
  ) {}

  async register(data: {
    email: string;
    password: string;
    name: string;
    walletAddress: string;
  }): Promise<{ user: User; token: string }> {
    const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    const hashedPassword = await hash(data.password, 10);
    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
      userRoles: [{ role: { name: 'buyer' as const } }],
    });

    await this.userRepository.save(user);

    const token = sign({ id: user.id, email: user.email }, config.jwtSecret, { expiresIn: '24h' });

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = sign({ id: user.id, email: user.email }, config.jwtSecret, { expiresIn: '24h' });

    return { user, token };
  }

  async walletLogin(
    walletAddress: string,
    signature: string
  ): Promise<{ user: User; token: string; expiresIn: number }> {
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new BadRequestError('Invalid wallet address');
    }

    const message = 'StarShop Login';
    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new UnauthorizedError('Invalid signature');
    }

    const user = await this.userRepository.findOne({
      where: { walletAddress },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const role = user.userRoles?.[0]?.role?.name || 'buyer';
    const token = sign({ id: user.id, walletAddress: user.walletAddress, role }, config.jwtSecret, {
      expiresIn: '1h',
    });

    return { user, token, expiresIn: 3600 };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: Number(id) } });
    if (!user) {
      throw new BadRequestError('User not found');
    }
    return user;
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
      user = userRepository.create({
        walletAddress,
      });
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
    const payload = {
      sub: user.id,
      walletAddress: user.walletAddress,
      role: primaryRole,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
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
    const userRole = userRoleRepository.create({
      userId: user.id,
      roleId: role.id,
      user,
      role,
    });
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

    // Assign default buyer role
    return this.assignRole(userId, 'buyer');
  }
}
