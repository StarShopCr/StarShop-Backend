import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Attribute } from './Attribute';

@Entity('attribute_values')
export class AttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Attribute)
  attribute: Attribute;

  @Column()
  value: string;

  @CreateDateColumn()
  createdAt: Date;
}
