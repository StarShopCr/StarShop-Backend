import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository, SelectQueryBuilder } from "typeorm"
import { BuyerRequestsService } from "../services/buyer-requests.service"
import { BuyerRequest, BuyerRequestStatus } from "../entities/buyer-request.entity"
import { NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common"
import { jest } from "@jest/globals"

describe("BuyerRequestsService", () => {
  let service: BuyerRequestsService
  let repository: jest.Mocked<Repository<BuyerRequest>>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<BuyerRequest>>

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  } as unknown as jest.Mocked<SelectQueryBuilder<BuyerRequest>>

  // Helper function to create a complete mock BuyerRequest
  const createMockBuyerRequest = (overrides: Partial<BuyerRequest> = {}): BuyerRequest => ({
    id: 1,
    title: "Test Request",
    description: "Test Description",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: 1,
    userId: 1,
    status: BuyerRequestStatus.OPEN,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    user: {
      id: 1,
      name: "Test User",
      walletAddress: "0x123",
    } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    searchVector: null,
    ...overrides,
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyerRequestsService,
        {
          provide: getRepositoryToken(BuyerRequest),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<BuyerRequestsService>(BuyerRequestsService)
    repository = module.get(getRepositoryToken(BuyerRequest))
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
      const mockRequest = createMockBuyerRequest({
        ...createDto,
        userId,
        status: BuyerRequestStatus.OPEN,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      mockRepository.create.mockReturnValue(mockRequest)
      mockRepository.save.mockResolvedValue(mockRequest)

      const result = await service.create(createDto, userId)

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
        expiresAt: expect.any(Date),
        status: BuyerRequestStatus.OPEN,
      })
      expect(result.title).toBe(createDto.title)
    })

    it("should throw BadRequestException if budgetMin > budgetMax", async () => {
      const createDto = {
        title: "Test Request",
        budgetMin: 200,
        budgetMax: 100,
        categoryId: 1,
      }

      await expect(service.create(createDto, 1)).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException if expiration date is in the past", async () => {
      const createDto = {
        title: "Test Request",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: 1,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      }

      await expect(service.create(createDto, 1)).rejects.toThrow(BadRequestException)
    })
  })

  describe("findAll", () => {
    beforeEach(() => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)
    })

    it("should return paginated buyer requests", async () => {
      const query = { page: 1, limit: 10 }
      const mockRequests = [
        createMockBuyerRequest({
          id: 1,
          title: "Request 1",
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        }),
        createMockBuyerRequest({
          id: 2,
          title: "Request 2",
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        }),
      ]

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockRequests, 2])

      const result = await service.findAll(query)

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it("should apply search filter correctly", async () => {
      const query = { page: 1, limit: 10, search: "test keyword" }
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.findAll(query)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("to_tsvector"),
        expect.objectContaining({
          search: "test keyword",
          searchLike: "%test keyword%",
        }),
      )
    })

    it("should apply category filter correctly", async () => {
      const query = { page: 1, limit: 10, categoryId: 5 }
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.findAll(query)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("request.categoryId = :categoryId", { categoryId: 5 })
    })

    it("should apply budget filters correctly", async () => {
      const query = { page: 1, limit: 10, budgetMin: 100, budgetMax: 500 }
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.findAll(query)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("request.budgetMax >= :budgetMin", { budgetMin: 100 })
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("request.budgetMin <= :budgetMax", { budgetMax: 500 })
    })

    it("should apply expiring soon filter correctly", async () => {
      const query = { page: 1, limit: 10, expiringSoon: true }
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.findAll(query)

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("request.expiresAt <= :threeDaysFromNow", {
        threeDaysFromNow: expect.any(Date),
      })
    })

    it("should apply sorting correctly", async () => {
      const query = { page: 1, limit: 10, sortBy: "budgetMin" as const, sortOrder: "ASC" as const }
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0])

      await service.findAll(query)

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("request.budgetMin", "ASC")
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith("request.createdAt", "DESC")
    })
  })

  describe("findOne", () => {
    it("should return a buyer request by id", async () => {
      const mockRequest = createMockBuyerRequest({
        id: 1,
        title: "Test Request",
        status: BuyerRequestStatus.OPEN,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        user: { id: 1, name: "Test User", walletAddress: "0x123" } as any,
      })

      mockRepository.findOne.mockResolvedValue(mockRequest)

      const result = await service.findOne(1)

      expect(result.id).toBe(1)
      expect(result.title).toBe("Test Request")
      expect(result.isExpiringSoon).toBe(false)
      expect(result.daysUntilExpiry).toBeGreaterThan(3)
    })

    it("should mark request as expiring soon if within 3 days", async () => {
      const mockRequest = createMockBuyerRequest({
        id: 1,
        title: "Test Request",
        status: BuyerRequestStatus.OPEN,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        user: { id: 1, name: "Test User", walletAddress: "0x123" } as any,
      })

      mockRepository.findOne.mockResolvedValue(mockRequest)

      const result = await service.findOne(1)

      expect(result.isExpiringSoon).toBe(true)
      expect(result.daysUntilExpiry).toBe(2)
    })

    it("should throw NotFoundException if request not found", async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe("update", () => {
    it("should update a buyer request successfully", async () => {
      const updateDto = { title: "Updated Title" }
      const mockRequest = createMockBuyerRequest({
        id: 1,
        title: "Original Title",
        userId: 1,
        status: BuyerRequestStatus.OPEN,
        budgetMin: 100,
        budgetMax: 200,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      })

      mockRepository.findOne.mockResolvedValue(mockRequest)
      mockRepository.save.mockResolvedValue({ ...mockRequest, ...updateDto })

      const result = await service.update(1, updateDto, 1)

      expect(result.title).toBe("Updated Title")
    })

    it("should throw ForbiddenException if user is not owner", async () => {
      const mockRequest = createMockBuyerRequest({
        id: 1,
        userId: 1,
        status: BuyerRequestStatus.OPEN,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      })
      mockRepository.findOne.mockResolvedValue(mockRequest)

      await expect(service.update(1, {}, 2)).rejects.toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException if request is closed", async () => {
      const mockRequest = createMockBuyerRequest({
        id: 1,
        userId: 1,
        status: BuyerRequestStatus.CLOSED,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      })
      mockRepository.findOne.mockResolvedValue(mockRequest)

      await expect(service.update(1, {}, 1)).rejects.toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException if request has expired", async () => {
      const mockRequest = createMockBuyerRequest({
        id: 1,
        userId: 1,
        status: BuyerRequestStatus.OPEN,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      })
      mockRepository.findOne.mockResolvedValue(mockRequest)

      await expect(service.update(1, {}, 1)).rejects.toThrow(ForbiddenException)
    })

    it("should validate budget range on update", async () => {
      const updateDto = { budgetMin: 200, budgetMax: 100 }
      const mockRequest = createMockBuyerRequest({
        id: 1,
        userId: 1,
        status: BuyerRequestStatus.OPEN,
        budgetMin: 50,
        budgetMax: 150,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      })

      mockRepository.findOne.mockResolvedValue(mockRequest)

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(BadRequestException)
    })
  })

  describe("getSearchSuggestions", () => {
    it("should return search suggestions", async () => {
      const mockSuggestions = [{ title: "Web Development" }, { title: "Web Design" }, { title: "Website Maintenance" }]

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)
      mockQueryBuilder.getRawMany.mockResolvedValue(mockSuggestions)

      const result = await service.getSearchSuggestions("web", 3)

      expect(result).toEqual(["Web Development", "Web Design", "Website Maintenance"])
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("request.status = :status", {
        status: BuyerRequestStatus.OPEN,
      })
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("request.title ILIKE :query", { query: "%web%" })
    })

    it("should return empty array for short queries", async () => {
      const result = await service.getSearchSuggestions("a")
      expect(result).toEqual([])
    })
  })

  describe("getPopularCategories", () => {
    it("should return popular categories with counts", async () => {
      const mockCategories = [
        { categoryId: "1", count: "10" },
        { categoryId: "2", count: "8" },
        { categoryId: "3", count: "5" },
      ]

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)
      mockQueryBuilder.getRawMany.mockResolvedValue(mockCategories)

      const result = await service.getPopularCategories()

      expect(result).toEqual([
        { categoryId: 1, count: 10 },
        { categoryId: 2, count: 8 },
        { categoryId: 3, count: 5 },
      ])
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith("request.categoryId")
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("count", "DESC")
    })
  })
})