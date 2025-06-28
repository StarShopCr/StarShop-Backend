import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const req = await this.buyerRequestRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('BuyerRequest not found');
    req.isBlocked = isBlocked;
    await this.buyerRequestRepo.save(req);
    return req;
  }
}
