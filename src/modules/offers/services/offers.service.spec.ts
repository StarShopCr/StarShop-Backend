import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { OffersService } from '../services/offers.service';
import { Offer } from '../entities/offer.entity';
import { BuyerRequest } from '../entities/buyer-request.entity';
import { Product } from '../../products/entities/product.entity';
import { OfferStatus } from '../enums/offer-status.enum';
import { AppUser } from 'src/types/auth-request.type';

// Mock data
const mockSeller: AppUser = { id: 1, walletAddress: 'seller-wallet', role: [] };
const mockBuyer: AppUser = { id: 2, walletAddress: 'buyer-wallet', role: [] };

const mockBuyerRequest: BuyerRequest = {
  id: 1,
  title: 'I need a new laptop',
  description: 'Looking for a MacBook Pro',
  buyerId: mockBuyer.id as number,
  buyer: null, // Relations are not needed for this test scope
  offers: [],
  createdAt: new Date(),
};

const mockProduct: Product = {
  id: 1,
  name: 'MacBook Pro',
  description: 'A great laptop',
  productType: null,
  variants: [],
  sellerId: mockSeller.id as number,
  seller: null,
  createdAt: new Date(),
};

const mockOffer: Offer = {
  id: 1,
  title: 'My MacBook Pro Offer',
  description: 'I have what you need',
  price: 1500,
  status: OfferStatus.PENDING,
  sellerId: mockSeller.id as number,
  seller: null,
  requestId: mockBuyerRequest.id,
  request: mockBuyerRequest,
  productId: mockProduct.id,
  product: mockProduct,
  createdAt: new Date(),
};

describe('OffersService', () => {
  let service: OffersService;
  let offerRepository: Repository<Offer>;
  let buyerRequestRepository: Repository<BuyerRequest>;
  let productRepository: Repository<Product>;

  // Mock repository factory
  const mockRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: getRepositoryToken(Offer), useFactory: mockRepository },
        { provide: getRepositoryToken(BuyerRequest), useFactory: mockRepository },
        { provide: getRepositoryToken(Product), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
    offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
    buyerRequestRepository = module.get<Repository<BuyerRequest>>(getRepositoryToken(BuyerRequest));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOffer', () => {
    it('should create and return an offer successfully', async () => {
      const createOfferDto = {
        title: 'New Offer',
        description: 'A great deal',
        price: 100,
        requestId: 1,
        productId: 1,
      };

      jest.spyOn(buyerRequestRepository, 'findOneBy').mockResolvedValue(mockBuyerRequest);
      jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(mockProduct);
      jest.spyOn(offerRepository, 'create').mockReturnValue(mockOffer);
      jest.spyOn(offerRepository, 'save').mockResolvedValue(mockOffer);

      const result = await service.createOffer(createOfferDto, mockSeller);

      expect(result).toEqual(mockOffer);
      expect(buyerRequestRepository.findOneBy).toHaveBeenCalledWith({ id: createOfferDto.requestId });
      expect(productRepository.findOneBy).toHaveBeenCalledWith({ id: createOfferDto.productId, sellerId: mockSeller.id as number });
      expect(offerRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if buyer request does not exist', async () => {
      jest.spyOn(buyerRequestRepository, 'findOneBy').mockResolvedValue(null);
      await expect(service.createOffer({} as any, mockSeller)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if product does not belong to the seller', async () => {
      jest.spyOn(buyerRequestRepository, 'findOneBy').mockResolvedValue(mockBuyerRequest);
      jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(null); // Simulate product not found for this seller
      await expect(service.createOffer({ requestId: 1, productId: 1 } as any, mockSeller)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('acceptOffer', () => {
    it('should accept an offer and reject others', async () => {
        const pendingOffer = { ...mockOffer, status: OfferStatus.PENDING };
        const otherPendingOffer = { ...mockOffer, id: 2, status: OfferStatus.PENDING };
        const acceptedOffer = { ...pendingOffer, status: OfferStatus.ACCEPTED };
    
        jest.spyOn(service as any, 'findOfferAndValidate').mockResolvedValue(pendingOffer);
        jest.spyOn(offerRepository, 'save').mockResolvedValue(acceptedOffer);
        jest.spyOn(offerRepository, 'find').mockResolvedValue([otherPendingOffer]);
        jest.spyOn(offerRepository, 'update').mockResolvedValue(undefined);
    
        const result = await service.acceptOffer(pendingOffer.id, mockBuyer.id as number);
    
        expect(result.status).toEqual(OfferStatus.ACCEPTED);
        expect(offerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: OfferStatus.ACCEPTED }));
        expect(offerRepository.update).toHaveBeenCalledWith({ id: expect.anything() }, { status: OfferStatus.REJECTED });
    });

    it('should throw an error if findOfferAndValidate fails', async () => {
      const errorMessage = 'Offer cannot be processed';
      jest.spyOn(service as any, 'findOfferAndValidate').mockRejectedValue(new UnprocessableEntityException(errorMessage));
      await expect(service.acceptOffer(99, mockBuyer.id as number)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('rejectOffer', () => {
    it('should reject an offer successfully', async () => {
      const pendingOffer = { ...mockOffer, status: OfferStatus.PENDING };
      const rejectedOffer = { ...pendingOffer, status: OfferStatus.REJECTED };

      jest.spyOn(service as any, 'findOfferAndValidate').mockResolvedValue(pendingOffer);
      jest.spyOn(offerRepository, 'save').mockResolvedValue(rejectedOffer);

      const result = await service.rejectOffer(pendingOffer.id, mockBuyer.id as number);

      expect(result.status).toEqual(OfferStatus.REJECTED);
      expect(offerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: OfferStatus.REJECTED }));
    });
  });

  describe('findOfferAndValidate', () => {
    it('should return a valid offer', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer);
      jest.spyOn(offerRepository, 'findOneBy').mockResolvedValue(null); // No other offer is accepted

      const result = await (service as any).findOfferAndValidate(mockOffer.id, mockBuyer.id as number);
      expect(result).toEqual(mockOffer);
    });

    it('should throw NotFoundException if offer is not found', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(null);
      await expect((service as any).findOfferAndValidate(99, mockBuyer.id as number)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the buyer', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer);
      const wrongBuyerId = 999;
      await expect((service as any).findOfferAndValidate(mockOffer.id, wrongBuyerId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnprocessableEntityException if offer is not pending', async () => {
      const acceptedOffer = { ...mockOffer, status: OfferStatus.ACCEPTED };
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(acceptedOffer);
      await expect((service as any).findOfferAndValidate(acceptedOffer.id, mockBuyer.id as number)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException if another offer has already been accepted', async () => {
      const anotherAcceptedOffer = { ...mockOffer, id: 2, status: OfferStatus.ACCEPTED };
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer);
      jest.spyOn(offerRepository, 'findOneBy').mockResolvedValue(anotherAcceptedOffer);
      await expect((service as any).findOfferAndValidate(mockOffer.id, mockBuyer.id as number)).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
