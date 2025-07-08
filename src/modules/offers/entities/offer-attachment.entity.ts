import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { Offer } from "./offer.entity"

export enum AttachmentType {
  IMAGE = "image",
  PDF = "pdf",
  DOCUMENT = "document",
}

@Entity("offer_attachments")
export class OfferAttachment {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(
    () => Offer,
    (offer) => offer.attachments,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "offer_id" })
  offer: Offer

  @Column({ name: "offer_id" })
  offerId: string

  @Column({ name: "file_url", type: "text" })
  fileUrl: string

  @Column({ name: "file_type", type: "varchar", length: 20 })
  fileType: AttachmentType

  @Column({ name: "file_name", nullable: true })
  fileName: string

  @Column({ name: "file_size", nullable: true })
  fileSize: number

  @Column({ name: "mime_type", nullable: true })
  mimeType: string

  @Column({ name: "provider_type", nullable: true })
  providerType: "cloudinary" | "s3"

  @Column({ name: "provider_public_id", nullable: true })
  providerPublicId: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
