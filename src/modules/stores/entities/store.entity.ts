import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  banner?: string;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  businessHours?: {
    monday?: { open: string; close: string; closed: boolean };
    tuesday?: { open: string; close: string; closed: boolean };
    wednesday?: { open: string; close: string; closed: boolean };
    thursday?: { open: string; close: string; closed: boolean };
    friday?: { open: string; close: string; closed: boolean };
    saturday?: { open: string; close: string; closed: boolean };
    sunday?: { open: string; close: string; closed: boolean };
  };

  @Column({ type: 'jsonb', nullable: true })
  categories?: string[];

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  policies?: {
    returnPolicy?: string;
    shippingPolicy?: string;
    privacyPolicy?: string;
    termsOfService?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  settings?: {
    autoApproveReviews?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  };

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.PENDING_APPROVAL,
  })
  status: StoreStatus;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  featuredAt?: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.stores)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column()
  sellerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
