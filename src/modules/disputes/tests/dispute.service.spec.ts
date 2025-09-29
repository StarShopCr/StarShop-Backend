import { Test, TestingModule } from '@nestjs/testing';
import { DisputeService } from '../services/dispute.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Dispute, DisputeStatus } from '../entities/dispute.entity';
import { OrderItem, OrderItemStatus } from '../../orders/entities/order-item.entity';
import { User } from '../../users/entities/user.entity';

const mockOrderItemRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  manager: {
    getRepository: jest.fn().mockReturnValue({ findOne: jest.fn() }),
  },
});
const mockDisputeRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('DisputeService', () => {
  let service: DisputeService;
  let disputeRepo;
  let orderItemRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeService,
        { provide: getRepositoryToken(Dispute), useFactory: mockDisputeRepo },
        { provide: getRepositoryToken(OrderItem), useFactory: mockOrderItemRepo },
      ],
    }).compile();
    service = module.get<DisputeService>(DisputeService);
    disputeRepo = module.get(getRepositoryToken(Dispute));
    orderItemRepo = module.get(getRepositoryToken(OrderItem));
  });

  it('debe crear una disputa y actualizar el estado', async () => {
    const orderItem = { id: 'oi1', status: OrderItemStatus.ACTIVE };
    const user = { id: 1 };
    orderItemRepo.findOne.mockResolvedValue(orderItem);
    disputeRepo.findOne.mockResolvedValue(undefined);
    orderItemRepo.manager.getRepository().findOne.mockResolvedValue(user);
    disputeRepo.create.mockReturnValue({ id: 'd1', order_item: orderItem, buyer: user, status: DisputeStatus.OPEN });
    disputeRepo.save.mockResolvedValue({ id: 'd1' });
    orderItemRepo.save.mockResolvedValue({ ...orderItem, status: OrderItemStatus.DISPUTED });

    const result = await service.startDispute('oi1', { id: 1 }, 'Motivo');
    expect(result).toHaveProperty('id', 'd1');
    expect(orderItemRepo.save).toHaveBeenCalledWith({ ...orderItem, status: OrderItemStatus.DISPUTED });
  });

  it('debe bloquear disputa duplicada', async () => {
    const orderItem = { id: 'oi1', status: OrderItemStatus.ACTIVE };
    orderItemRepo.findOne.mockResolvedValue(orderItem);
    disputeRepo.findOne.mockResolvedValue({ id: 'd1' });
    await expect(service.startDispute('oi1', { id: 1 }, 'Motivo')).rejects.toThrow('A dispute already exists for this milestone');
  });

  it('debe bloquear si el milestone no está activo', async () => {
    const orderItem = { id: 'oi1', status: OrderItemStatus.DISPUTED };
    orderItemRepo.findOne.mockResolvedValue(orderItem);
    disputeRepo.findOne.mockResolvedValue(undefined);
    await expect(service.startDispute('oi1', { id: 1 }, 'Motivo')).rejects.toThrow('Only active milestones can be disputed');
  });
});
