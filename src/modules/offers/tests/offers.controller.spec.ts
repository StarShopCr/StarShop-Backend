import { Test, TestingModule } from "@nestjs/testing"
import { OffersController } from "../controllers/offers.controller"
import { OffersService } from "../services/offers.service"
import { OfferAttachmentService } from "../services/offer-attachment.service"
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../../auth/guards/roles.guard"
import { BadRequestException } from "@nestjs/common"
import { Express } from "express"

describe("OffersController", () => {
  let controller: OffersController
  let offersService: OffersService
  let offerAttachmentService: OfferAttachmentService

  const mockOffersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByBuyerRequest: jest.fn(),
    findBySeller: jest.fn(),
  }

  const mockOfferAttachmentService = {
    uploadAttachment: jest.fn(),
    getOfferAttachments: jest.fn(),
    deleteAttachment: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [
        {
          provide: OffersService,
          useValue: mockOffersService,
        },
        {
          provide: OfferAttachmentService,
          useValue: mockOfferAttachmentService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<OffersController>(OffersController)
    offersService = module.get<OffersService>(OffersService)
    offerAttachmentService = module.get<OfferAttachmentService>(OfferAttachmentService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("uploadAttachment", () => {
    const mockFile = {
      originalname: "test.jpg",
      mimetype: "image/jpeg",
      size: 1024,
    } as Express.Multer.File

    const mockRequest = {
      user: { id: "user-1" },
    }

    it("should upload attachment successfully", async () => {
      const mockResponse = {
        id: "attachment-1",
        fileUrl: "https://example.com/test.jpg",
        fileType: "image",
        fileName: "test.jpg",
        fileSize: 1024,
        mimeType: "image/jpeg",
        createdAt: new Date(),
      }

      mockOfferAttachmentService.uploadAttachment.mockResolvedValue(mockResponse)

      const result = await controller.uploadAttachment("offer-1", mockFile, {}, mockRequest as any)

      expect(result).toBe(mockResponse)
      expect(mockOfferAttachmentService.uploadAttachment).toHaveBeenCalledWith(
        "offer-1",
        mockFile,
        "user-1",
        "cloudinary",
      )
    })

    it("should throw BadRequestException when no file provided", async () => {
      await expect(controller.uploadAttachment("offer-1", null, {}, mockRequest as any)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe("getAttachments", () => {
    it("should return offer attachments", async () => {
      const mockAttachments = [
        {
          id: "attachment-1",
          fileUrl: "https://example.com/test.jpg",
          fileType: "image",
          fileName: "test.jpg",
          fileSize: 1024,
          mimeType: "image/jpeg",
          createdAt: new Date(),
        },
      ]

      mockOfferAttachmentService.getOfferAttachments.mockResolvedValue(mockAttachments)

      const result = await controller.getAttachments("offer-1")

      expect(result).toBe(mockAttachments)
      expect(mockOfferAttachmentService.getOfferAttachments).toHaveBeenCalledWith("offer-1")
    })
  })

  describe("deleteAttachment", () => {
    it("should delete attachment successfully", async () => {
      const mockRequest = { user: { id: "user-1" } }

      mockOfferAttachmentService.deleteAttachment.mockResolvedValue(undefined)

      await controller.deleteAttachment("attachment-1", mockRequest as any)

      expect(mockOfferAttachmentService.deleteAttachment).toHaveBeenCalledWith("attachment-1", "user-1")
    })
  })
})
