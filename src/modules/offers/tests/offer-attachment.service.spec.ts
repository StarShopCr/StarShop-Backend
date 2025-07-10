import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common"
import { OfferAttachmentService } from "../services/offer-attachment.service"
import { OfferAttachment, AttachmentType } from "../entities/offer-attachment.entity"
import { Offer } from "../entities/offer.entity"
import { FileService } from "../../files/services/file.service"
import { FileType } from "../../files/entities/file.entity"
import { jest } from "@jest/globals"
import { Express } from "express"

describe("OfferAttachmentService", () => {
  let service: OfferAttachmentService
  let offerAttachmentRepository: jest.Mocked<Repository<OfferAttachment>>
  let offerRepository: jest.Mocked<Repository<Offer>>
  let fileService: jest.Mocked<FileService>

  beforeEach(async () => {
    const mockOfferAttachmentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
    } as any

    const mockOfferRepository = {
      findOne: jest.fn(),
    } as any

    const mockFileService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferAttachmentService,
        {
          provide: getRepositoryToken(OfferAttachment),
          useValue: mockOfferAttachmentRepository,
        },
        {
          provide: getRepositoryToken(Offer),
          useValue: mockOfferRepository,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
      ],
    }).compile()

    service = module.get<OfferAttachmentService>(OfferAttachmentService)
    offerAttachmentRepository = module.get(getRepositoryToken(OfferAttachment))
    offerRepository = module.get(getRepositoryToken(Offer))
    fileService = module.get(FileService) as jest.Mocked<FileService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("uploadAttachment", () => {
    const mockFile = {
      originalname: "test.jpg",
      mimetype: "image/jpeg",
      size: 1024 * 1024, // 1MB
      buffer: Buffer.from("test"),
    } as Express.Multer.File

    const mockOffer = {
      id: "offer-1",
      sellerId: "user-1",
      seller: { id: "user-1" },
    }

    const mockUploadedFile = {
      id: "file-1",
      url: "https://example.com/test.jpg",
      providerPublicId: "test-id",
    }

    it("should upload attachment successfully", async () => {
      jest.mocked(offerRepository.findOne).mockResolvedValue(mockOffer as any)
      jest.mocked(offerAttachmentRepository.count).mockResolvedValue(2)
      jest.mocked(fileService.uploadFile).mockResolvedValue(mockUploadedFile as any)
      
      const mockAttachment = {
        id: "attachment-1",
        offerId: "offer-1",
        fileUrl: mockUploadedFile.url,
        fileType: AttachmentType.IMAGE,
        fileName: mockFile.originalname,
        fileSize: mockFile.size,
        mimeType: mockFile.mimetype,
        createdAt: new Date(),
      }
      
      jest.mocked(offerAttachmentRepository.create).mockReturnValue(mockAttachment as any)
      jest.mocked(offerAttachmentRepository.save).mockResolvedValue(mockAttachment as any)

      const result = await service.uploadAttachment("offer-1", mockFile, "user-1")

      expect(result).toBeDefined()
      expect(result.fileType).toBe(AttachmentType.IMAGE)
      expect(result.fileName).toBe(mockFile.originalname)
      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile, "user-1", "cloudinary", FileType.IMAGE)
    })

    it("should throw NotFoundException when offer does not exist", async () => {
      jest.mocked(offerRepository.findOne).mockResolvedValue(null)

      await expect(service.uploadAttachment("non-existent", mockFile, "user-1")).rejects.toThrow(NotFoundException)
    })

    it("should throw ForbiddenException when user is not the offer owner", async () => {
      jest.mocked(offerRepository.findOne).mockResolvedValue({
        ...mockOffer,
        sellerId: "different-user",
      } as any)

      await expect(service.uploadAttachment("offer-1", mockFile, "user-1")).rejects.toThrow(ForbiddenException)
    })

    it("should throw BadRequestException for invalid file type", async () => {
      jest.mocked(offerRepository.findOne).mockResolvedValue(mockOffer as any)
      const invalidFile = { ...mockFile, mimetype: "text/plain" }

      await expect(service.uploadAttachment("offer-1", invalidFile, "user-1")).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException for file too large", async () => {
      jest.mocked(offerRepository.findOne).mockResolvedValue(mockOffer as any)
      const largeFile = { ...mockFile, size: 15 * 1024 * 1024 } // 15MB

      await expect(service.uploadAttachment("offer-1", largeFile, "user-1")).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException when attachment limit exceeded", async () => {
      jest.mocked(offerRepository.findOne).mockResolvedValue(mockOffer as any)
      jest.mocked(offerAttachmentRepository.count).mockResolvedValue(5)

      await expect(service.uploadAttachment("offer-1", mockFile, "user-1")).rejects.toThrow(BadRequestException)
    })
  })

  describe("getOfferAttachments", () => {
    it("should return attachments for valid offer", async () => {
      const mockAttachments = [
        {
          id: "attachment-1",
          offerId: "offer-1",
          fileUrl: "https://example.com/test1.jpg",
          fileType: AttachmentType.IMAGE,
          fileName: "test1.jpg",
          fileSize: 1024,
          mimeType: "image/jpeg",
          createdAt: new Date(),
        },
      ]

      jest.mocked(offerRepository.findOne).mockResolvedValue({ id: "offer-1" } as any)
      jest.mocked(offerAttachmentRepository.find).mockResolvedValue(mockAttachments as any)

      const result = await service.getOfferAttachments("offer-1")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("attachment-1")
    })

    it("should throw NotFoundException for non-existent offer", async () => {
      jest.mocked(offerRepository.findOne).mockResolvedValue(null)

      await expect(service.getOfferAttachments("non-existent")).rejects.toThrow(NotFoundException)
    })
  })

  describe("deleteAttachment", () => {
    const mockAttachment = {
      id: "attachment-1",
      offer: {
        id: "offer-1",
        sellerId: "user-1",
      },
      providerPublicId: "test-id",
    }

    it("should delete attachment successfully", async () => {
      jest.mocked(offerAttachmentRepository.findOne).mockResolvedValue(mockAttachment as any)
      jest.mocked(offerAttachmentRepository.remove).mockResolvedValue(mockAttachment as any)

      await service.deleteAttachment("attachment-1", "user-1")

      expect(offerAttachmentRepository.remove).toHaveBeenCalledWith(mockAttachment)
    })

    it("should throw NotFoundException for non-existent attachment", async () => {
      jest.mocked(offerAttachmentRepository.findOne).mockResolvedValue(null)

      await expect(service.deleteAttachment("non-existent", "user-1")).rejects.toThrow(NotFoundException)
    })

    it("should throw ForbiddenException when user is not the owner", async () => {
      jest.mocked(offerAttachmentRepository.findOne).mockResolvedValue({
        ...mockAttachment,
        offer: { ...mockAttachment.offer, sellerId: "different-user" },
      } as any)

      await expect(service.deleteAttachment("attachment-1", "user-1")).rejects.toThrow(ForbiddenException)
    })
  })
})