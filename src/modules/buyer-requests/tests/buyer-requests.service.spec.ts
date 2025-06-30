import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { BuyerRequestsService } from "../services/buyer-requests.service"
import { BuyerRequest, BuyerRequestStatus } from "../entities/buyer-request.entity"
import { NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common"

describe("BuyerRequestsService", () => {
  let service: BuyerRequestsService
  let repository: Partial<Repository<BuyerRequest>>

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  }

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyerRequestsService,
        {
          provide: getRepositoryToken(BuyerRequest),
          useValue: repository,
        },
      ],
    }).compile()

    service = module.get<BuyerRequestsService>(BuyerRequestsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create a buyer request successfully", async () => {
      const createDto = {
        title: "Test Request",
        description: "Test Description",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: 1,
      }
      const userId = 1

      const mockRequest = {
        id: 1,
        ...createDto,
        userId,
        status: BuyerRequestStatus.OPEN,
      }

      ;(repository.create as jest.Mock).mockReturnValue(mockRequest)
      ;(repository.save as jest.Mock).mockResolvedValue(mockRequest)

      const result = await service.create(createDto, userId)

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
        status: BuyerRequestStatus.OPEN,
      })
      expect(result.title).toBe(createDto.title)
    })

    it("should throw BadRequestException if budgetMin > budgetMax", async () => {
      const createDto = {
        title: "Invalid Budget",
        description: "Budget issue",
        budgetMin: 200,
        budgetMax: 100,
        categoryId: 1,
      }

      await expect(service.create(createDto, 1)).rejects.toThrow(BadRequestException)
    })
  })

  describe("findAll", () => {
    it("should return paginated buyer requests", async () => {
      const query = { page: 1, limit: 10 }
      const mockRequests = [
        { id: 1, title: "Request 1", status: BuyerRequestStatus.OPEN },
        { id: 2, title: "Request 2", status: BuyerRequestStatus.OPEN },
      ]

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockRequests, 2])

      const result = await service.findAll(query)

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
    })
  })

  describe("findOne", () => {
    it("should return a buyer request by id", async () => {
      const mockRequest = {
        id: 1,
        title: "Test Request",
        status: BuyerRequestStatus.OPEN,
        user: { id: 1, name: "Test User", walletAddress: "0x123" },
      }

      ;(repository.findOne as jest.Mock).mockResolvedValue(mockRequest)

      const result = await service.findOne(1)

      expect(result.id).toBe(1)
    })

    it("should throw NotFoundException if request not found", async () => {
      ;(repository.findOne as jest.Mock).mockResolvedValue(null)

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe("update", () => {
    it("should update a buyer request successfully", async () => {
      const updateDto = { title: "Updated Title" }
      const mockRequest = {
        id: 1,
        title: "Original Title",
        userId: 1,
        status: BuyerRequestStatus.OPEN,
        budgetMin: 100,
        budgetMax: 200,
      }

      ;(repository.findOne as jest.Mock).mockResolvedValue(mockRequest)
      ;(repository.save as jest.Mock).mockResolvedValue({ ...mockRequest, ...updateDto })

      const result = await service.update(1, updateDto, 1)

      expect(result.title).toBe("Updated Title")
    })

    it("should throw ForbiddenException if user is not owner", async () => {
      const mockRequest = { id: 1, userId: 1, status: BuyerRequestStatus.OPEN }
      ;(repository.findOne as jest.Mock).mockResolvedValue(mockRequest)

      await expect(service.update(1, {}, 2)).rejects.toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException if request is closed", async () => {
      const mockRequest = { id: 1, userId: 1, status: BuyerRequestStatus.CLOSED }
      ;(repository.findOne as jest.Mock).mockResolvedValue(mockRequest)

      await expect(service.update(1, {}, 1)).rejects.toThrow(ForbiddenException)
    })
  })

  describe("remove", () => {
    it("should soft delete a buyer request", async () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        status: BuyerRequestStatus.OPEN,
      }

      ;(repository.findOne as jest.Mock).mockResolvedValue(mockRequest)
      ;(repository.save as jest.Mock).mockResolvedValue({
        ...mockRequest,
        status: BuyerRequestStatus.CLOSED,
      })

      await service.remove(1, 1)

      expect(repository.save).toHaveBeenCalledWith({
        ...mockRequest,
        status: BuyerRequestStatus.CLOSED,
      })
    })

    it("should throw ForbiddenException if user is not owner", async () => {
      const mockRequest = { id: 1, userId: 1 }
      ;(repository.findOne as jest.Mock).mockResolvedValue(mockRequest)

      await expect(service.remove(1, 2)).rejects.toThrow(ForbiddenException)
    })
  })
})
