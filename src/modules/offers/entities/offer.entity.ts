import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm"
import { User } from "../../users/entities/user.entity"
import { BuyerRequest } from "../../buyer-requests/entities/buyer-request.entity"
import { OfferAttachment } from "./offer-attachment.entity"

export enum OfferStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

@Entity("offers")
export class Offer {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "text" })
  description: string

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number

  @Column({ type: "int", default: 7 })
  deliveryDays: number

  @Column({
    type: "enum",
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus

  @Column({ type: "text", nullable: true })
  notes: string

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "seller_id" })
  seller: User

  @Column({ name: "seller_id" })
  sellerId: string

  @ManyToOne(() => BuyerRequest, { nullable: false })
  @JoinColumn({ name: "buyer_request_id" })
  buyerRequest: BuyerRequest

  @Column({ name: "buyer_request_id" })
  buyerRequestId: string

  @OneToMany(
    () => OfferAttachment,
    (attachment) => attachment.offer,
    {
      cascade: true,
    },
  )
  attachments: OfferAttachment[]

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date
}
