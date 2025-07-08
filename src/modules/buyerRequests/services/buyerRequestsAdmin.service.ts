import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuyerRequest } from '../entities/buyerRequest.entity';

@Injectable()
export class BuyerRequestsAdminService {
  constructor(
    @InjectRepository(BuyerRequest)
    private readonly buyerRequestRepo: Repository<BuyerRequest>,
  ) {}

  async findAll() {
    return this.buyerRequestRepo.find();
  }

  async block(id: number, isBlocked: boolean) {
    if (typeof isBlocked !== 'boolean') {
      throw new BadRequestException('isBlocked must be a boolean value');
    }
    return this.buyerRequestRepo.manager.transaction(async (transactionalEntityManager) => {
      const req = await transactionalEntityManager.findOne(BuyerRequest, { where: { id } });
      if (!req) throw new NotFoundException('BuyerRequest not found');
      req.isBlocked = isBlocked;
      return transactionalEntityManager.save(req);
    });
  }
}
