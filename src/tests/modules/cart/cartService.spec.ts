import { CartService } from '../../../modules/cart/services/cart.service';
import AppDataSource from '../../../config/ormconfig';

jest.mock('../../../config/ormconfig', () => ({
  __esModule: true,
  default: {
    getRepository: jest.fn(),
  },
}));

describe('CartService', () => {
  let cartService: CartService;
  let mockCartRepository: any;
  let mockCartItemRepository: any;

  const testUserId = 'user-123';
  const testProductId = 'product-456';
  const testCartId = 'cart-789';
  const now = new Date();

  const mockCart = {
    id: testCartId,
    userId: testUserId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    items: [],
  };

  const mockCartItem = {
    id: 'item-001',
    cartId: testCartId,
    productId: testProductId,
    quantity: 1,
    product: { id: testProductId, name: 'Test Product' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCartRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockCartItemRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockImplementationOnce(() => mockCartRepository)
      .mockImplementationOnce(() => mockCartItemRepository);

    cartService = new CartService();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart if found', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);

      const cart = await cartService.getOrCreateCart(testUserId);

      expect(mockCartRepository.findOne).toHaveBeenCalledWith({
        where: { userId: testUserId },
        relations: ['items', 'items.product'],
      });
      expect(cart).toEqual(mockCart);
    });

    it('should create new cart if not found', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(mockCart);
      mockCartRepository.save.mockResolvedValue(mockCart);

      const cart = await cartService.getOrCreateCart(testUserId);

      expect(mockCartRepository.create).toHaveBeenCalledWith({ userId: testUserId });
      expect(mockCartRepository.save).toHaveBeenCalledWith(mockCart);
      expect(cart).toEqual(mockCart);
    });

    it('should clear expired cart and reset expiresAt', async () => {
      const expiredCart = {
        ...mockCart,
        expiresAt: new Date(now.getTime() - 1000), // expired (already passed)
        items: [mockCartItem], // Cart has some items
      };

      mockCartRepository.findOne.mockResolvedValue(expiredCart);

      // Mock the save to update the cart object
      mockCartRepository.save.mockImplementation((cart) => {
        // When cart is saved, return it with updated values
        return { ...cart };
      });

      // Mock the delete to clear items
      mockCartItemRepository.delete.mockImplementation(() => {
        // Clear items array when delete is called
        expiredCart.items = [];
        return { affected: 1 };
      });

      const cart = await cartService.getOrCreateCart(testUserId);

      expect(mockCartItemRepository.delete).toHaveBeenCalledWith({ cartId: testCartId });
      expect(cart.expiresAt.getTime()).toBeGreaterThan(now.getTime()); // ExpiresAt should be updated
      expect(cart.items.length).toBe(0); // Cart should be empty now
      expect(cart).toEqual(expiredCart); // Cart should be returned with updated expiration
    });
  });

  describe('getCart', () => {
    it('should return cart in DTO format', async () => {
      const cartWithItems = { ...mockCart, items: [mockCartItem] };
      mockCartRepository.findOne.mockResolvedValue(cartWithItems);

      const cart = await cartService.getCart(testUserId);

      expect(cart).toEqual({
        id: testCartId,
        userId: testUserId,
        createdAt: now,
        items: [
          {
            id: mockCartItem.id,
            productId: mockCartItem.productId,
            quantity: mockCartItem.quantity,
            product: mockCartItem.product,
          },
        ],
      });
    });
  });

  describe('addItem', () => {
    it('should add a new item if it does not exist', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartItemRepository.findOne.mockResolvedValue(null);
      mockCartItemRepository.create.mockReturnValue(mockCartItem);
      mockCartItemRepository.save.mockResolvedValue(mockCartItem);

      const updatedCart = await cartService.addItem(testUserId, testProductId, 2);

      expect(mockCartItemRepository.create).toHaveBeenCalledWith({
        cartId: testCartId,
        productId: testProductId,
        quantity: 2,
      });
      expect(mockCartItemRepository.save).toHaveBeenCalled();
      expect(updatedCart).toBeDefined();
    });

    it('should update quantity if item already exists', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartItemRepository.findOne.mockResolvedValue({ ...mockCartItem, quantity: 1 });
      mockCartItemRepository.save.mockResolvedValue({ ...mockCartItem, quantity: 3 });

      const updatedCart = await cartService.addItem(testUserId, testProductId, 2);

      expect(mockCartItemRepository.save).toHaveBeenCalled();
      expect(updatedCart).toBeDefined();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartItemRepository.delete.mockResolvedValue({ affected: 1 });

      const updatedCart = await cartService.removeItem(testUserId, testProductId);

      expect(mockCartItemRepository.delete).toHaveBeenCalledWith({
        cartId: testCartId,
        productId: testProductId,
      });
      expect(updatedCart).toBeDefined();
    });
  });

  describe('clearCart', () => {
    it('should clear all items from the cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartItemRepository.delete.mockResolvedValue({ affected: 1 });

      const updatedCart = await cartService.clearCart(testUserId);

      expect(mockCartItemRepository.delete).toHaveBeenCalledWith({ cartId: testCartId });
      expect(updatedCart.items).toEqual([]);
    });
  });
});
