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

  @CreateDateColumn()
  createdAt: Date;
}
