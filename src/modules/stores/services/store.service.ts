import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from '../entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { CreateStoreDto, UpdateStoreDto } from '../dto/store.dto';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a default store for a seller
   */
  async createDefaultStore(sellerId: number, sellerData: any): Promise<Store> {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId },
      relations: ['userRoles'],
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check if seller already has a default store
    const existingStore = await this.storeRepository.findOne({
      where: { sellerId, name: `${seller.name || 'My Store'}'s Store` },
    });

    if (existingStore) {
      return existingStore;
    }

    // Create default store based on seller data
    const defaultStore = this.storeRepository.create({
      name: `${seller.name || 'My Store'}'s Store`,
      description: sellerData?.businessDescription || 'Welcome to my store!',
      categories: sellerData?.categories || [],
      contactInfo: {
        email: seller.email,
        phone: sellerData?.phone,
        website: sellerData?.website,
      },
      address: {
        city: seller.location,
        country: seller.country,
      },
      sellerId,
      status: StoreStatus.PENDING_APPROVAL,
    });

    return await this.storeRepository.save(defaultStore);
  }

  /**
   * Create a new store for a seller
   */
  async createStore(sellerId: number, createStoreDto: CreateStoreDto): Promise<Store> {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId },
      relations: ['userRoles'],
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check if seller has seller role
    const hasSellerRole = seller.userRoles.some(ur => ur.role.name === 'seller');
    if (!hasSellerRole) {
      throw new BadRequestException('Only sellers can create stores');
    }

    const store = this.storeRepository.create({
      ...createStoreDto,
      sellerId,
      status: StoreStatus.PENDING_APPROVAL,
    });

    return await this.storeRepository.save(store);
  }

  /**
   * Get all stores for a seller
   */
  async getSellerStores(sellerId: number): Promise<Store[]> {
    return await this.storeRepository.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific store by ID
   */
  async getStoreById(storeId: number): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['seller'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  /**
   * Update a store
   */
  async updateStore(storeId: number, sellerId: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId, sellerId },
    });

    if (!store) {
      throw new NotFoundException('Store not found or access denied');
    }

    Object.assign(store, updateStoreDto);
    return await this.storeRepository.save(store);
  }

  /**
   * Delete a store
   */
  async deleteStore(storeId: number, sellerId: number): Promise<void> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId, sellerId },
    });

    if (!store) {
      throw new NotFoundException('Store not found or access denied');
    }

    await this.storeRepository.remove(store);
  }

  /**
   * Get all active stores
   */
  async getActiveStores(): Promise<Store[]> {
    return await this.storeRepository.find({
      where: { status: StoreStatus.ACTIVE },
      relations: ['seller'],
      order: { rating: 'DESC', reviewCount: 'DESC' },
    });
  }

  /**
   * Search stores by category, location, or name
   */
  async searchStores(query: string, category?: string, location?: string): Promise<Store[]> {
    const queryBuilder = this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.seller', 'seller')
      .where('store.status = :status', { status: StoreStatus.ACTIVE });

    if (query) {
      queryBuilder.andWhere(
        '(store.name ILIKE :query OR store.description ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('store.categories @> :category', { category: [category] });
    }

    if (location) {
      queryBuilder.andWhere(
        '(store.address->>\'city\' ILIKE :location OR store.address->>\'country\' ILIKE :location)',
        { location: `%${location}%` }
      );
    }

    return await queryBuilder
      .orderBy('store.rating', 'DESC')
      .addOrderBy('store.reviewCount', 'DESC')
      .getMany();
  }

  /**
   * Update store status (admin only)
   */
  async updateStoreStatus(storeId: number, status: StoreStatus): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    store.status = status;
    
    if (status === StoreStatus.ACTIVE && !store.verifiedAt) {
      store.verifiedAt = new Date();
    }

    return await this.storeRepository.save(store);
  }

  /**
   * Get store statistics
   */
  async getStoreStats(storeId: number, sellerId: number): Promise<any> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId, sellerId },
    });

    if (!store) {
      throw new NotFoundException('Store not found or access denied');
    }

    // Here you would typically aggregate data from orders, reviews, etc.
    // For now, returning basic store info
    return {
      id: store.id,
      name: store.name,
      status: store.status,
      rating: store.rating,
      reviewCount: store.reviewCount,
      createdAt: store.createdAt,
      verifiedAt: store.verifiedAt,
    };
  }
}
