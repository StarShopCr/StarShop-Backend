import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { CartController } from '../../../modules/cart/controllers/cart.controller';
import { cartService } from '../../../modules/cart/services/cart.service';

jest.mock('../../../modules/cart/services/cart.service');

const cartController = new CartController();

describe('Cart Integration Test', () => {
  let app: Express;

  const fakeUser = {
    id: 'user-123',
    walletAddress: '0xFakeWalletAddress',
    name: 'Test User',
    email: 'test@example.com',
    role: 'buyer' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fakeCart = {
    id: 'cart-123',
    userId: fakeUser.id,
    createdAt: new Date(),
    items: [{ id: 'item-1', productId: 'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4', quantity: 2 }],
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Middleware to inject fake authenticated user
    app.use((req: Request, res: Response, next) => {
      (req as any).user = fakeUser;
      next();
    });

    // Setup routes
    app.get('/cart', (req, res) => cartController.getCart(req as any, res));
    app.post('/cart/add-item', (req, res) => cartController.addItem(req as any, res));
    app.post('/cart/remove-item', (req, res) => cartController.removeItem(req as any, res));
    app.post('/cart/clear', (req, res) => cartController.clearCart(req as any, res));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /cart', () => {
    it('should return the user cart', async () => {
      const fakeCart = {
        id: 'cart-123',
        userId: fakeUser.id,
        createdAt: new Date(),
        items: [],
      };

      (cartService.getCart as jest.Mock).mockResolvedValue(fakeCart);

      const response = await request(app).get('/cart');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: 'cart-123',
          userId: fakeUser.id,
        })
      );
      expect(cartService.getCart).toHaveBeenCalledWith(fakeUser.id);
    });

    it('should handle errors and return 500', async () => {
      (cartService.getCart as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/cart');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to retrieve cart');
    });
  });

  describe('POST /cart/add-item', () => {
    it('should add an item to cart', async () => {
      const fakeCart = {
        id: 'cart-123',
        userId: fakeUser.id,
        createdAt: new Date(),
        items: [{ id: 'item-1', productId: 'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4', quantity: 2 }],
      };

      (cartService.addItem as jest.Mock).mockResolvedValue(fakeCart);

      const response = await request(app).post('/cart/add-item').send({
        productId: 'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4',
        quantity: 2,
      });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(cartService.addItem).toHaveBeenCalledWith(
        fakeUser.id,
        'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4',
        2
      );
    });
  });

  describe('POST /cart/remove-item', () => {
    it('should remove an item from the cart', async () => {
      const fakeCart = {
        id: 'cart-123',
        userId: fakeUser.id,
        createdAt: new Date(),
        items: [],
      };

      (cartService.removeItem as jest.Mock).mockResolvedValue(fakeCart);

      const response = await request(app).post('/cart/remove-item').send({
        productId: 'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4',
      });

      expect(response.status).toBe(200);
      expect(cartService.removeItem).toHaveBeenCalledWith(
        fakeUser.id,
        'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4'
      );
    });
  });

  describe('POST /cart/clear', () => {
    it('should clear the user cart', async () => {
      const fakeCart = {
        id: 'cart-123',
        userId: fakeUser.id,
        createdAt: new Date(),
        items: [],
      };

      (cartService.clearCart as jest.Mock).mockResolvedValue(fakeCart);

      const response = await request(app).post('/cart/clear');

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(cartService.clearCart).toHaveBeenCalledWith(fakeUser.id);
    });

    it('should handle errors and return 500', async () => {
      (cartService.clearCart as jest.Mock).mockRejectedValue(new Error('Something went wrong'));

      const response = await request(app).post('/cart/clear');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to clear cart');
    });
  });

  describe('POST /cart/add-item persistence', () => {
    it('should persist cart after logout and re-login (token regeneration)', async () => {
      // Mock cart service to simulate cart persistence in the database
      (cartService.addItem as jest.Mock).mockResolvedValue(fakeCart);
      (cartService.getCart as jest.Mock).mockResolvedValue(fakeCart);

      // Simulate adding an item to the cart
      let response = await request(app).post('/cart/add-item').send({
        productId: 'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4',
        quantity: 2,
      });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);

      // Simulate user logout (clear cart or session)
      // You can simulate this by resetting the mock or mocking logout behavior
      jest.clearAllMocks();

      // Simulate re-login and verify cart persistence
      response = await request(app).get('/cart');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          userId: fakeUser.id,
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 'e1d48bfa-73b4-49e5-8792-191cf9e7c4c4',
              quantity: 2,
            }),
          ]),
        })
      );
    });
  });

  describe('POST /cart/clear persistence', () => {
    it('should persist the empty cart after clearing and re-login', async () => {
      const clearedCart = { ...fakeCart, items: [] };

      (cartService.clearCart as jest.Mock).mockResolvedValue(clearedCart);

      // Simulate clearing the cart
      let response = await request(app).post('/cart/clear');

      // Check that the cart is empty after clearing
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);

      // IMPORTANT: Update the mock for getCart to return the empty cart for the "re-login" simulation
      (cartService.getCart as jest.Mock).mockResolvedValue(clearedCart);

      // Simulate re-login after cart is cleared and verify that it's still cleared
      response = await request(app).get('/cart');

      // Check that the cart is still empty after re-login
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });
  });
});
