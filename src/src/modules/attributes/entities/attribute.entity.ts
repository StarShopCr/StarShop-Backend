import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { AttributeValue } from "./attribute-value.entity"

@Entity("attributes")
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: "varchar", length: 50, unique: true })
  name: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @OneToMany(
    () => AttributeValue,
    (attributeValue) => attributeValue.attribute,
    {
      cascade: true,
      onDelete: "CASCADE",
    },
  )
  values: AttributeValue[]
}
