import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CouponType } from '../dto/coupon.dto';
import { CouponUsage } from './coupon-usage.entity';

export { CouponUsage };

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  code: string;

  @Column({ type: 'varchar', enum: CouponType })
  type: CouponType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column('decimal', { precision: 10, scale: 2 })
  minPurchaseAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  maxDiscountAmount: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  usageLimit: number;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  created_by: string;

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages: CouponUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
