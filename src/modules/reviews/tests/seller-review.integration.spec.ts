import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { SellerReviewService } from '../services/seller-review.service';
import { SellerReviewController } from '../controllers/seller-review.controller';
import { SellerReview } from '../entities/seller-review.entity';
import { User } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateSellerReviewDTO } from '../dto/seller-review.dto';

describe('SellerReview Integration Tests', () => {
  let app: INestApplication;
  let reviewRepository: Repository<SellerReview>;
  let userRepository: Repository<User>;
  let offerRepository: Repository<Offer>;
  let buyerRequestRepository: Repository<BuyerRequest>;

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [SellerReview, User, Offer, BuyerRequest],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([SellerReview, User, Offer, BuyerRequest]),
      ],
      controllers: [SellerReviewController],
      providers: [SellerReviewService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    reviewRepository = moduleFixture.get<Repository<SellerReview>>(getRepositoryToken(SellerReview));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    offerRepository = moduleFixture.get<Repository<Offer>>(getRepositoryToken(Offer));
    buyerRequestRepository = moduleFixture.get<Repository<BuyerRequest>>(getRepositoryToken(BuyerRequest));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await reviewRepository.clear();
    await offerRepository.clear();
    await buyerRequestRepository.clear();
    await userRepository.clear();

    // Mock user for authentication
    mockJwtAuthGuard.canActivate.mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'buyer-uuid' };
      return true;
    });
  });

  describe('POST /reviews', () => {
    it('should create a review successfully', async () => {
      // Setup test data
      const seller = await userRepository.save({
        id: 'seller-uuid',
        walletAddress: 'seller-wallet',
        name: 'Test Seller',
      });

      const buyer = await userRepository.save({
        id: 'buyer-uuid',
        walletAddress: 'buyer-wallet',
        name: 'Test Buyer',
      });

      const buyerRequest = await buyerRequestRepository.save({
        id: 1,
        buyerId: 'buyer-uuid',
        title: 'Test Request',
        description: 'Test Description',
        maxPrice: 100,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      });

      const offer = await offerRepository.save({
        id: 'offer-uuid',
        buyerRequestId: 1,
        sellerId: 'seller-uuid',
        title: 'Test Offer',
        description: 'Test Offer Description',
        price: 50,
        wasPurchased: true,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACCEPTED' as any,
      });

      const createReviewDto: CreateSellerReviewDTO = {
        offerId: 'offer-uuid',
        rating: 5,
        comment: 'Great seller!',
      };

      const response = await request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.rating).toBe(5);
      expect(response.body.comment).toBe('Great seller!');
      expect(response.body.offerId).toBe('offer-uuid');
      expect(response.body.buyerId).toBe('buyer-uuid');
    });

    it('should return 400 when offer does not exist', async () => {
      const createReviewDto: CreateSellerReviewDTO = {
        offerId: 'non-existent-offer',
        rating: 5,
        comment: 'Great seller!',
      };

      await request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(400);
    });

    it('should return 400 when rating is out of range', async () => {
      const createReviewDto: CreateSellerReviewDTO = {
        offerId: 'offer-uuid',
        rating: 6,
        comment: 'Great seller!',
      };

      await request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(400);
    });
  });

  describe('GET /users/:id/reviews', () => {
    it('should return seller reviews successfully', async () => {
      // Setup test data
      const seller = await userRepository.save({
        id: 'seller-uuid',
        walletAddress: 'seller-wallet',
        name: 'Test Seller',
        averageSellerRating: 4.5,
        totalSellerReviews: 2,
      });

      const buyer = await userRepository.save({
        id: 'buyer-uuid',
        walletAddress: 'buyer-wallet',
        name: 'Test Buyer',
      });

      const buyerRequest = await buyerRequestRepository.save({
        id: 1,
        buyerId: 'buyer-uuid',
        title: 'Test Request',
        description: 'Test Description',
        maxPrice: 100,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const offer = await offerRepository.save({
        id: 'offer-uuid',
        buyerRequestId: 1,
        sellerId: 'seller-uuid',
        title: 'Test Offer',
        description: 'Test Offer Description',
        price: 50,
        wasPurchased: true,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACCEPTED' as any,
      });

      const review = await reviewRepository.save({
        offerId: 'offer-uuid',
        buyerId: 'buyer-uuid',
        rating: 5,
        comment: 'Great seller!',
      });

      const response = await request(app.getHttpServer())
        .get('/users/seller-uuid/reviews')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('seller');
      expect(response.body.seller.id).toBe('seller-uuid');
      expect(response.body.reviews).toHaveLength(1);
    });

    it('should return 404 when seller does not exist', async () => {
      await request(app.getHttpServer())
        .get('/users/non-existent-seller/reviews')
        .expect(404);
    });
  });

  describe('PUT /reviews/:id', () => {
    it('should update review successfully', async () => {
      // Setup test data
      const seller = await userRepository.save({
        id: 'seller-uuid',
        walletAddress: 'seller-wallet',
        name: 'Test Seller',
      });

      const buyer = await userRepository.save({
        id: 'buyer-uuid',
        walletAddress: 'buyer-wallet',
        name: 'Test Buyer',
      });

      const buyerRequest = await buyerRequestRepository.save({
        id: 1,
        buyerId: 'buyer-uuid',
        title: 'Test Request',
        description: 'Test Description',
        maxPrice: 100,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const offer = await offerRepository.save({
        id: 'offer-uuid',
        buyerRequestId: 1,
        sellerId: 'seller-uuid',
        title: 'Test Offer',
        description: 'Test Offer Description',
        price: 50,
        wasPurchased: true,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACCEPTED' as any,
      });

      const review = await reviewRepository.save({
        offerId: 'offer-uuid',
        buyerId: 'buyer-uuid',
        rating: 3,
        comment: 'Original comment',
      });

      const updateData = {
        rating: 5,
        comment: 'Updated comment',
      };

      const response = await request(app.getHttpServer())
        .put(`/reviews/${review.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.rating).toBe(5);
      expect(response.body.comment).toBe('Updated comment');
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete review successfully', async () => {
      // Setup test data
      const seller = await userRepository.save({
        id: 'seller-uuid',
        walletAddress: 'seller-wallet',
        name: 'Test Seller',
      });

      const buyer = await userRepository.save({
        id: 'buyer-uuid',
        walletAddress: 'buyer-wallet',
        name: 'Test Buyer',
      });

      const buyerRequest = await buyerRequestRepository.save({
        id: 1,
        buyerId: 'buyer-uuid',
        title: 'Test Request',
        description: 'Test Description',
        maxPrice: 100,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const offer = await offerRepository.save({
        id: 'offer-uuid',
        buyerRequestId: 1,
        sellerId: 'seller-uuid',
        title: 'Test Offer',
        description: 'Test Offer Description',
        price: 50,
        wasPurchased: true,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACCEPTED' as any,
      });

      const review = await reviewRepository.save({
        offerId: 'offer-uuid',
        buyerId: 'buyer-uuid',
        rating: 5,
        comment: 'Great seller!',
      });

      await request(app.getHttpServer())
        .delete(`/reviews/${review.id}`)
        .expect(200);

      const deletedReview = await reviewRepository.findOne({ where: { id: review.id } });
      expect(deletedReview).toBeNull();
    });
  });
});
