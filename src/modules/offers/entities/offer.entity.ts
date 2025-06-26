import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Check,
} from 'typeorm';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { OfferStatus } from '../enums/offer-status.enum';

@Entity('offers')
@Check(`"price" >= 0`)
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_id' })
  requestId: string;

  @ManyToOne(() => BuyerRequest, (buyerRequest) => buyerRequest.offers, { 
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'request_id' })
  buyerRequest: BuyerRequest;

  @Column({ name: 'seller_id' })
  sellerId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'product_id', nullable: true })
  productId?: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
