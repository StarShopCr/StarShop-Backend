import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { Attribute } from "./attribute.entity"

@Entity("attribute_values")
export class AttributeValue {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: "varchar", length: 100 })
  value: string

  @Column({ name: "attribute_id" })
  attributeId: number

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @ManyToOne(
    () => Attribute,
    (attribute) => attribute.values,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "attribute_id" })
  attribute: Attribute
}
