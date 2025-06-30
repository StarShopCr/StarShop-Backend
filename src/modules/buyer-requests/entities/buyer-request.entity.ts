import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "../../users/entities/user.entity"

export enum BuyerRequestStatus {
  OPEN = "open",
  CLOSED = "closed",
}

@Entity("buyer_requests")
export class BuyerRequest {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 100 })
  title: string

  @Column({ type: "text", nullable: true })
  description: string

  @Column({ type: "decimal", precision: 10, scale: 2 })
  budgetMin: number

  @Column({ type: "decimal", precision: 10, scale: 2 })
  budgetMax: number

  @Column()
  categoryId: number

  @Column({
    type: "enum",
    enum: BuyerRequestStatus,
    default: BuyerRequestStatus.OPEN,
  })
  status: BuyerRequestStatus

  @Column()
  userId: number

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "userId" })
  user: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
