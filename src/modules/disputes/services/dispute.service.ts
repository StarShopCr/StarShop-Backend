
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute, DisputeStatus } from '../entities/dispute.entity';
import { OrderItem, OrderItemStatus } from '../../orders/entities/order-item.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(Dispute)
    private disputeRepository: Repository<Dispute>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async startDispute(orderItemId: string, buyer: { id: string | number }, reason?: string): Promise<Dispute> {
    const orderItem = await this.orderItemRepository.findOne({ where: { id: orderItemId } });
    if (!orderItem) throw new BadRequestException('Order item not found');
    if (orderItem.status !== OrderItemStatus.ACTIVE) throw new BadRequestException('Only active milestones can be disputed');

    const existing = await this.disputeRepository.findOne({ where: { order_item: { id: orderItemId } } });
    if (existing) throw new BadRequestException('A dispute already exists for this milestone');

    // Buscar el usuario completo
  const buyerId = typeof buyer.id === 'string' ? parseInt(buyer.id, 10) : buyer.id;
  const buyerUser = await this.orderItemRepository.manager.getRepository(User).findOne({ where: { id: buyerId } });
    if (!buyerUser) throw new NotFoundException('Buyer not found');

    const dispute = this.disputeRepository.create({
      order_item: orderItem,
      buyer: buyerUser,
      status: DisputeStatus.OPEN,
      reason,
    });
    await this.disputeRepository.save(dispute);
    orderItem.status = OrderItemStatus.DISPUTED;
    await this.orderItemRepository.save(orderItem);
    return dispute;
  }
}
