import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Offer } from './offer.entity';

@Entity('buyer_requests')
export class BuyerRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ name: 'buyer_id' })
  buyerId: number;

  @ManyToOne(() => User, (user) => user.buyerRequests)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @OneToMany(() => Offer, (offer) => offer.request)
  offers: Offer[];

  @CreateDateColumn()
  createdAt: Date;
}