import type { AttachmentType } from "../entities/offer-attachment.entity"

export class OfferAttachmentResponseDto {
  id: string
  fileUrl: string
  fileType: AttachmentType
  fileName: string
  fileSize: number
  mimeType: string
  createdAt: Date
}
