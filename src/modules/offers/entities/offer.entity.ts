import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { BuyerRequest } from './buyer-request.entity';
import { OfferStatus } from '../enums/offer-status.enum';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal')
  price: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @Column({ name: 'seller_id' })
  sellerId: number;

  @ManyToOne(() => User, (user) => user.offers)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'request_id' })
  requestId: number;

  @ManyToOne(() => BuyerRequest, (request) => request.offers)
  @JoinColumn({ name: 'request_id' })
  request: BuyerRequest;

  @Column({ name: 'product_id', nullable: true })
  productId?: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @CreateDateColumn()
  createdAt: Date;
}