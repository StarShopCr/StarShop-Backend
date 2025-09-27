import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';

@Entity('coupon_usages')
export class CouponUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  couponId: string;

  @Column()
  usedAt: Date;

  @ManyToOne(() => Coupon, (coupon) => coupon.usages)
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
