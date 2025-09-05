import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';

@Entity('seller_reviews')
@Unique(['offerId', 'buyerId']) // Ensure one review per offer per buyer
@Check(`"rating" >= 1 AND "rating" <= 5`) // Ensure rating is between 1-5
export class SellerReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'offer_id', type: 'uuid' })
  offerId: string;

  @ManyToOne(() => Offer, { nullable: false })
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
