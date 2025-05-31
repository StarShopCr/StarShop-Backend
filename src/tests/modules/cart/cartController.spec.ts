import { CartController } from '../../../modules/cart/controllers/cart.controller';
import { cartService } from '../../../modules/cart/services/cart.service';
// import { AddItemDto, RemoveItemDto } from '../../../modules/cart/dtos/cart.dto';
import { validate } from 'class-validator';
import * as classValidator from 'class-validator';

jest.mock('../../../modules/cart/services/cart.service');
// jest.mock('class-validator', () => ({
//   validate: jest.fn(),
// }));

jest.spyOn(classValidator, 'validate').mockImplementation(jest.fn());

describe('CartController', () => {
  let cartController: CartController;
  let mockRequest: any;
  let mockResponse: any;

  const testUserId = 'user-123';
  const testProductId = 'product-456';

  const mockCartResponse = {
    id: 'cart-789',
    userId: testUserId,
    createdAt: new Date(),
    items: [],
  };

  beforeEach(() => {
    cartController = new CartController();

    mockRequest = {
      user: { id: testUserId },
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return cart successfully', async () => {
      (cartService.getCart as jest.Mock).mockResolvedValue(mockCartResponse);

      await cartController.getCart(mockRequest, mockResponse);

      expect(cartService.getCart).toHaveBeenCalledWith(testUserId);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCartResponse);
    });

    it('should handle errors and return 500', async () => {
      (cartService.getCart as jest.Mock).mockRejectedValue(new Error('DB error'));

      await cartController.getCart(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to retrieve cart',
        })
      );
    });
  });

  describe('addItem', () => {
    it('should validate and add item successfully', async () => {
      (validate as jest.Mock).mockResolvedValue([]);
      (cartService.addItem as jest.Mock).mockResolvedValue(mockCartResponse);

      mockRequest.body = { productId: testProductId, quantity: 2 };

      await cartController.addItem(mockRequest, mockResponse);

      expect(validate).toHaveBeenCalled();
      expect(cartService.addItem).toHaveBeenCalledWith(testUserId, testProductId, 2);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCartResponse);
    });

    it('should return 400 if validation fails', async () => {
      (validate as jest.Mock).mockResolvedValue([{ property: 'productId' }]);

      await cartController.addItem(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
    });

    it('should handle errors and return 500', async () => {
      (validate as jest.Mock).mockResolvedValue([]);
      (cartService.addItem as jest.Mock).mockRejectedValue(new Error('DB error'));

      await cartController.addItem(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to add item to cart',
        })
      );
    });
  });

  describe('removeItem', () => {
    it('should validate and remove item successfully', async () => {
      (validate as jest.Mock).mockResolvedValue([]);
      (cartService.removeItem as jest.Mock).mockResolvedValue(mockCartResponse);

      mockRequest.body = { productId: testProductId };

      await cartController.removeItem(mockRequest, mockResponse);

      expect(validate).toHaveBeenCalled();
      expect(cartService.removeItem).toHaveBeenCalledWith(testUserId, testProductId);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCartResponse);
    });

    it('should return 400 if validation fails', async () => {
      (validate as jest.Mock).mockResolvedValue([{ property: 'productId' }]);

      await cartController.removeItem(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
    });

    it('should handle errors and return 500', async () => {
      (validate as jest.Mock).mockResolvedValue([]);
      (cartService.removeItem as jest.Mock).mockRejectedValue(new Error('DB error'));

      await cartController.removeItem(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to remove item from cart',
        })
      );
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      (cartService.clearCart as jest.Mock).mockResolvedValue(mockCartResponse);

      await cartController.clearCart(mockRequest, mockResponse);

      expect(cartService.clearCart).toHaveBeenCalledWith(testUserId);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCartResponse);
    });

    it('should handle errors and return 500', async () => {
      (cartService.clearCart as jest.Mock).mockRejectedValue(new Error('DB error'));

      await cartController.clearCart(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to clear cart',
        })
      );
    });
  });
});
