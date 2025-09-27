import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toNumber(id: string): number {
    const num = Number(id);
    if (isNaN(num)) throw new NotFoundException('Invalid ID format');
    return num;
  }

  async addToWishlist(userId: string, productId: string): Promise<void> {
    const userIdNum = this.toNumber(userId);
    const productIdNum = this.toNumber(productId);

    const product = await this.productRepository.findOne({ where: { id: productIdNum } });
    if (!product) throw new NotFoundException('Product not found');

    const exists = await this.wishlistRepository.findOne({
      where: { user: { id: userIdNum }, product: { id: productIdNum } },
    });

    if (exists) throw new ConflictException('Product already in wishlist');

    const user = await this.userRepository.findOne({ where: { id: userIdNum } });
    if (!user) throw new NotFoundException('User not found');

    const wishlistItem = this.wishlistRepository.create({ user, product });
    await this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const userIdNum = this.toNumber(userId);
    const productIdNum = this.toNumber(productId);

    const result = await this.wishlistRepository.delete({
      user: { id: userIdNum },
      product: { id: productIdNum },
    });

    if (result.affected === 0) throw new NotFoundException('Wishlist item not found');
  }

  async getWishlist(userId: string): Promise<Wishlist[]> {
    const userIdNum = this.toNumber(userId);

    return this.wishlistRepository.find({
      where: { user: { id: userIdNum } },
      relations: ['product'],
      order: { addedAt: 'DESC' },
    });
  }
}
