import { AppDataSource } from '../../../config/database';
import { User } from '../entities/user.entity';
import { BadRequestError } from '../../../utils/errors';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/entities/user-role.entity';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async createUser(data: {
    walletAddress: string;
    name?: string;
    email?: string;
    role: 'buyer' | 'seller' | 'admin';
    location?: string;
    country?: string;
    buyerData?: any;
    sellerData?: any;
  }): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { walletAddress: data.walletAddress },
    });
    if (existing) {
      throw new BadRequestError('Wallet address already registered');
    }

    // Validate role-specific data
    if (data.role === 'buyer' && data.buyerData === undefined) {
      throw new BadRequestError('Buyer data is required for buyer role');
    }
    if (data.role === 'seller' && data.sellerData === undefined) {
      throw new BadRequestError('Seller data is required for seller role');
    }

    const user = this.userRepository.create({
      walletAddress: data.walletAddress,
      name: data.name,
      email: data.email,
      location: data.location,
      country: data.country,
      buyerData: data.buyerData,
      sellerData: data.sellerData,
    });
    const saved = await this.userRepository.save(user);

    // assign role to user_roles table
    const roleRepo = AppDataSource.getRepository(Role);
    const userRoleRepo = AppDataSource.getRepository(UserRole);
    const role = await roleRepo.findOne({ where: { name: data.role } });
    if (role) {
      const userRole = userRoleRepo.create({
        userId: saved.id,
        roleId: role.id,
        user: saved,
        role,
      });
      await userRoleRepo.save(userRole);
    }
    return saved;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      throw new BadRequestError('User not found');
    }
    return user;
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.find({ relations: ['userRoles', 'userRoles.role'] });
  }

  async updateUser(id: string, data: { 
    name?: string; 
    email?: string; 
    location?: string; 
    country?: string; 
    buyerData?: any; 
    sellerData?: any; 
  }): Promise<User> {
    const user = await this.getUserById(id);

    if (data.email) {
      const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestError('Email already in use');
      }
      user.email = data.email;
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.location !== undefined) {
      user.location = data.location;
    }

    if (data.country !== undefined) {
      user.country = data.country;
    }

    if (data.buyerData !== undefined) {
      user.buyerData = data.buyerData;
    }

    if (data.sellerData !== undefined) {
      user.sellerData = data.sellerData;
    }

    return this.userRepository.save(user);
  }

  async getUserOrders(id: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['orders'],
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    return user.orders;
  }

  async getUserWishlist(id: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['wishlist'],
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    return user.wishlist;
  }
}
