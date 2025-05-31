import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../../services/User.service';
import { RoleService } from './role.service';
import { User } from '../../../entities/User';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import AppDataSource from '../../../config/ormconfig';

type RoleName = 'buyer' | 'seller' | 'admin';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService
  ) {}

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
    const user = await this.userService.getUserById(userId);
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

    return this.userService.getUserById(userId);
  }

  async removeRole(userId: number): Promise<User> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRoleRepository = AppDataSource.getRepository(UserRole);
    await userRoleRepository.delete({ userId });

    // Assign default buyer role
    return this.assignRole(userId, 'buyer');
  }
}
