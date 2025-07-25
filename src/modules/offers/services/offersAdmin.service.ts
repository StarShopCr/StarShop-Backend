import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/offer.entity';

@Injectable()
export class OffersAdminService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {}

  async findAll() {
    return this.offerRepo.find();
  }

  async block(id: string, isBlocked: boolean) {
    const offer = await this.offerRepo.findOne({ where: { id: id } });
    if (!offer) throw new NotFoundException('Offer not found');
    offer.isBlocked = isBlocked;
    await this.offerRepo.save(offer);
    return offer;
  }
}
