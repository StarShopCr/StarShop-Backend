import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { ProductVariant } from './ProductVariant';
import { AttributeValue } from './AttributeValue';

@Entity('product_variant_attributes')
export class ProductVariantAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductVariant)
  productVariant: ProductVariant;

  @ManyToOne(() => AttributeValue)
  attributeValue: AttributeValue;

  @CreateDateColumn()
  createdAt: Date;
}
