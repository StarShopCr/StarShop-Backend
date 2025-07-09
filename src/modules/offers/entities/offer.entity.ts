import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BuyerRequest } from '../../buyer-requests/entities/buyer-request.entity';
import { Product } from '../../products/entities/product.entity';
import { OfferAttachment } from './offer-attachment.entity';
import { OfferStatus } from '../enums/offer-status.enum';

@Entity('offers')
@Check(`"price" >= 0`)
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ name: 'request_id' })
  requestId: number;

  @Column({ name: 'buyer_request_id' })
  buyerRequestId: string;

  @ManyToOne(() => BuyerRequest, (buyerRequest) => buyerRequest.offers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'buyer_request_id' })
  buyerRequest: BuyerRequest;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'product_id', nullable: true })
  productId?: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  isBlocked: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 7 })
  deliveryDays: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => OfferAttachment, (attachment) => attachment.offer, {
    cascade: true,
  })
  attachments: OfferAttachment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
