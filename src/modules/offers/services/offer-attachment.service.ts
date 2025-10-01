import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { OfferAttachment, AttachmentType } from '../entities/offer-attachment.entity';
import { Offer } from '../entities/offer.entity';
import { FileService } from '../../files/services/file.service';
import { FileType } from '../../files/entities/file.entity';
import { OfferAttachmentResponseDto } from '../dto/offer-attachment-response.dto';
import { Express } from 'express';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OfferAttachmentService {
  constructor(
    @InjectRepository(OfferAttachment)
    private offerAttachmentRepository: Repository<OfferAttachment>,
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    @Inject(FileService)
    private fileService: FileService
  ) {}

  async uploadAttachment(
    offerId: string,
    file: Express.Multer.File,
    userId: number,
    provider: 'cloudinary' | 's3' = 'cloudinary'
  ): Promise<OfferAttachmentResponseDto> {
    // Verify offer exists and user owns it
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['seller'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.sellerId !== userId.toString()) {
      throw new ForbiddenException('You can only add attachments to your own offers');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX) are allowed.'
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Check attachment limit per offer (max 5 attachments)
    const existingAttachments = await this.offerAttachmentRepository.count({
      where: { offerId },
    });

    if (existingAttachments >= 5) {
      throw new BadRequestException('Maximum 5 attachments allowed per offer');
    }

    try {
      // Upload file using FileService
      const fileType = this.getFileTypeFromMimeType(file.mimetype);
      const uploadedFile = await this.fileService.uploadFile(file, userId, provider, fileType);

      // Determine attachment type
      const attachmentType = this.getAttachmentTypeFromMimeType(file.mimetype);

      // Create attachment record
      const attachment = this.offerAttachmentRepository.create({
        offerId,
        fileUrl: uploadedFile.url,
        fileType: attachmentType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        providerType: provider,
        providerPublicId: uploadedFile.providerPublicId,
      });

      const savedAttachment = await this.offerAttachmentRepository.save(attachment);

      return this.mapToResponseDto(savedAttachment);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload attachment');
    }
  }

  async getOfferAttachments(offerId: string): Promise<OfferAttachmentResponseDto[]> {
    // Verify offer exists
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    const attachments = await this.offerAttachmentRepository.find({
      where: { offerId },
      order: { createdAt: 'ASC' },
    });

    return attachments.map(this.mapToResponseDto);
  }

  async deleteAttachment(attachmentId: string, userId: number): Promise<void> {
    const attachment = await this.offerAttachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['offer', 'offer.seller'],
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.offer.sellerId !== userId.toString()) {
      throw new ForbiddenException('You can only delete attachments from your own offers');
    }

    try {
      // Delete file from storage provider
      if (attachment.providerPublicId) {
        // Note: FileService would need a deleteFile method
        // await this.fileService.deleteFile(attachment.providerPublicId, userId);
      }

      // Delete attachment record
      await this.offerAttachmentRepository.remove(attachment);
    } catch (error) {
      throw new BadRequestException('Failed to delete attachment');
    }
  }

  private getFileTypeFromMimeType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    } else if (
      mimeType === 'application/pdf' ||
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  private getAttachmentTypeFromMimeType(mimeType: string): AttachmentType {
    if (mimeType.startsWith('image/')) {
      return AttachmentType.IMAGE;
    } else if (mimeType === 'application/pdf') {
      return AttachmentType.PDF;
    }
    return AttachmentType.DOCUMENT;
  }

  private mapToResponseDto(attachment: OfferAttachment): OfferAttachmentResponseDto {
    return {
      id: attachment.id,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      createdAt: attachment.createdAt,
    };
  }
}
