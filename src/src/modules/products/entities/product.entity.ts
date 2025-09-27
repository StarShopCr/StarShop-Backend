import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ProductType } from '../../productTypes/entities/productTypes.entity';
import { ProductVariant } from '../../productVariants/entities/productVariants.entity';
import { User } from '../../users/entities/user.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => ProductType, (productType) => productType.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productTypeId' })
  productType: ProductType;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @Column({ name: 'seller_id' })
  sellerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @CreateDateColumn()
  createdAt: Date;
}
