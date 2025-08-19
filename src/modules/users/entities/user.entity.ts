import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { UserRole } from '../../auth/entities/user-role.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ type: 'json', nullable: true })
  buyerData?: any;

  @Column({ type: 'json', nullable: true })
  sellerData?: any;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlist: Wishlist[];

  @OneToMany(() => Store, (store) => store.seller)
  stores: Store[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
