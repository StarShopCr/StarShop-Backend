import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { CartResponseDto } from '../dtos/cart.dto';
import AppDataSource from '../../../config/ormconfig';
import { ProductVariant } from '../../productVariants/entities/productVariants.entity';
import { Product } from '../../products/entities/product.entity';
import { NotFoundError } from '../../../utils/errors';

export class CartService {
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;
  private productRepository: Repository<Product>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      await this.cartRepository.save(cart);
    }

    const now = new Date();
    if (cart && cart.expiresAt && cart.expiresAt < now) {
      await this.cartItemRepository.delete({ cartId: cart.id });
      cart.items = [];
      cart.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await this.cartRepository.save(cart);
    } else if (cart) {
      // Cart exists but hasn't expired, just update expiration
      cart.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await this.cartRepository.save(cart);
    } else {
      cart = this.cartRepository.create({
        userId,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    return {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      items: (cart.items || []).map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
      })),
    };
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.productRepository.findOne({ where: { id: Number(productId) } });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      await this.cartItemRepository.save(cartItem);
    } else {
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    if (quantity <= 0) {
      await this.cartItemRepository.remove(cartItem);
    } else {
      cartItem.quantity = quantity;
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    await this.cartItemRepository.delete({ cartId: cart.id });

    return {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      items: [],
    };
  }

  async mergeGuestCartWithUserCart(guestCartId: string, userId: string): Promise<CartResponseDto> {
    const guestCart = await this.cartRepository.findOne({
      where: { id: guestCartId },
      relations: ['items', 'items.product'],
    });

    const userCart = await this.getOrCreateCart(userId);

    if (guestCart && guestCart.items.length > 0) {
      for (const guestItem of guestCart.items) {
        const existingItem = userCart.items.find((item) => item.productId === guestItem.productId);

        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
          await this.cartItemRepository.save(existingItem);
        } else {
          const newCartItem = this.cartItemRepository.create({
            cartId: userCart.id,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
          });
          await this.cartItemRepository.save(newCartItem);
        }
      }

      // Clear the guest cart after merging
      await this.cartItemRepository.delete({ cartId: guestCart.id });
    }

    return this.getCart(userId);
  }

  async calculateTotal(cart: Cart): Promise<number> {
    let total = 0;

    // Fetching the price from the ProductVariant for each cart item
    for (const item of cart.items) {
      const productVariant = await this.getProductVariantForProduct(String(item.product.id));

      if (productVariant) {
        total += productVariant.price * item.quantity; // Calculate total price for the item
      }
    }

    // Apply any discounts if they exist
    if (cart.discount) {
      total -= (cart.discount / 100) * total; // Apply discount
    }

    return total;
  }

  // Helper method to get the ProductVariant for a product
  private async getProductVariantForProduct(productId: string): Promise<ProductVariant | null> {
    return await AppDataSource.getRepository(ProductVariant).findOne({
      where: { product: { id: Number(productId) } },
    });
  }
}

export const cartService = new CartService();
