import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OffersService } from '../services/offers.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { Notification } from '../../notifications/entities/notification.entity';

describe('Offer Notifications Integration', () => {
    let offersService: OffersService;
    let notificationService: NotificationService;
    let offerRepository: Repository<Offer>;
    let buyerRequestRepository: Repository<BuyerRequest>;
    let notificationRepository: Repository<Notification>;

    const mockOffer = {
        id: 'offer-123',
        sellerId: 456,
        buyerRequestId: 789,
        status: OfferStatus.PENDING,
        title: 'Test Offer',
        description: 'Test Description',
        price: 100,
        buyerRequest: {
            id: 789,
            title: 'Test Request',
            userId: 'buyer-123',
        },
        seller: {
            id: 456,
            name: 'Test Seller',
        },
    };

    const mockBuyerRequest = {
        id: 789,
        title: 'Test Request',
        userId: 'buyer-123',
        status: 'open',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OffersService,
                {
                    provide: getRepositoryToken(Offer),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(BuyerRequest),
                    useClass: Repository,
                },
                {
                    provide: 'DataSource',
                    useValue: {
                        transaction: jest.fn((cb) => cb({})),
                    },
                },
                {
                    provide: NotificationService,
                    useValue: {
                        createAndSendNotificationToUser: jest.fn().mockResolvedValue(true),
                    },
                },
            ],
        }).compile();

        offersService = module.get<OffersService>(OffersService);
        notificationService = module.get<NotificationService>(NotificationService);
        offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
        buyerRequestRepository = module.get<Repository<BuyerRequest>>(getRepositoryToken(BuyerRequest));
    });

    describe('accept offer', () => {
        it('should send notification when offer is accepted', async () => {
            // Arrange
            jest.spyOn(offerRepository, 'findOne')
                .mockResolvedValueOnce(mockOffer as any) // Primera llamada: obtener la oferta
                .mockResolvedValueOnce(null); // Segunda llamada: verificar si ya hay una aceptada

            jest.spyOn(offerRepository, 'save').mockResolvedValue({
                ...mockOffer,
                status: OfferStatus.ACCEPTED,
            } as any);

            jest.spyOn(offerRepository, 'find').mockResolvedValue([]); // No hay ofertas pendientes

            // Act
            await offersService.accept('offer-123', 'buyer-123');

            // Assert
            expect(notificationService.createAndSendNotificationToUser).toHaveBeenCalledWith({
                userId: '456',
                title: 'Offer Accepted!',
                message: 'Your offer for "Test Request" has been accepted!',
                type: 'offer_accepted',
                payload: {
                    offerId: 'offer-123',
                    requestTitle: 'Test Request',
                },
                entityId: 'offer-123',
            });
        });

        it('should send rejection notifications to other pending offers', async () => {
            // Arrange
            const pendingOffer = {
                ...mockOffer,
                id: 'pending-offer-456',
                sellerId: 789,
            };

            jest.spyOn(offerRepository, 'findOne')
                .mockResolvedValueOnce(mockOffer as any) // Oferta a aceptar
                .mockResolvedValueOnce(null); // No hay ofertas ya aceptadas

            jest.spyOn(offerRepository, 'save').mockResolvedValue({
                ...mockOffer,
                status: OfferStatus.ACCEPTED,
            } as any);

            jest.spyOn(offerRepository, 'find').mockResolvedValue([pendingOffer as any]);

            // Act
            await offersService.accept('offer-123', 'buyer-123');

            // Assert
            expect(notificationService.createAndSendNotificationToUser).toHaveBeenCalledTimes(2);

            // Primera llamada: notificación de aceptación
            expect(notificationService.createAndSendNotificationToUser).toHaveBeenNthCalledWith(1, {
                userId: '456',
                title: 'Offer Accepted!',
                message: 'Your offer for "Test Request" has been accepted!',
                type: 'offer_accepted',
                payload: {
                    offerId: 'offer-123',
                    requestTitle: 'Test Request',
                },
                entityId: 'offer-123',
            });

            // Segunda llamada: notificación de rechazo
            expect(notificationService.createAndSendNotificationToUser).toHaveBeenNthCalledWith(2, {
                userId: '789',
                title: 'Offer Rejected',
                message: 'Your offer for "Test Request" has been rejected.',
                type: 'offer_rejected',
                payload: {
                    offerId: 'pending-offer-456',
                    requestTitle: 'Test Request',
                },
                entityId: 'pending-offer-456',
            });
        });
    });

    describe('reject offer', () => {
        it('should send notification when offer is rejected', async () => {
            // Arrange
            jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
            jest.spyOn(offerRepository, 'save').mockResolvedValue({
                ...mockOffer,
                status: OfferStatus.REJECTED,
            } as any);

            // Act
            await offersService.reject('offer-123', 'buyer-123');

            // Assert
            expect(notificationService.createAndSendNotificationToUser).toHaveBeenCalledWith({
                userId: '456',
                title: 'Offer Rejected',
                message: 'Your offer for "Test Request" has been rejected.',
                type: 'offer_rejected',
                payload: {
                    offerId: 'offer-123',
                    requestTitle: 'Test Request',
                },
                entityId: 'offer-123',
            });
        });
    });
});