import { Test, TestingModule } from "@nestjs/testing"
import { BuyerRequestsController } from "../controllers/buyer-requests.controller"
import { BuyerRequestsService } from "../services/buyer-requests.service"
import { CreateBuyerRequestDto } from "../dto/create-buyer-request.dto"
import { UpdateBuyerRequestDto } from "../dto/update-buyer-request.dto"
import { BuyerRequestStatus } from "../entities/buyer-request.entity"
import { jest } from "@jest/globals"

describe("BuyerRequestsController", () => {
  let controller: BuyerRequestsController
  let service: jest.Mocked<BuyerRequestsService>
  let mockService: jest.Mocked<BuyerRequestsService>

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      getSearchSuggestions: jest.fn(),
      getPopularCategories: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<BuyerRequestsService>

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuyerRequestsController],
      providers: [
        {
          provide: BuyerRequestsService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<BuyerRequestsController>(BuyerRequestsController)
    service = mockService
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create a buyer request", async () => {
      const createDto: CreateBuyerRequestDto = {
        title: "Test Request",
        description: "Test Description",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: 1,
      }
      const mockRequest = { user: { id: 1 } }
   const expectedResult = {
  id: "1",
  title: createDto.title,
  description: createDto.description ?? "Default Description", // ensure it's defined
  budgetMin: createDto.budgetMin,
  budgetMax: createDto.budgetMax,
  categoryId: createDto.categoryId,
  userId: 1,
  status: BuyerRequestStatus.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
}


      service.create.mockResolvedValue(expectedResult)

      const result = await controller.create(createDto, mockRequest)

      expect(service.create).toHaveBeenCalledWith(createDto, 1)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("findAll", () => {
    it("should return paginated buyer requests", async () => {
      const query = { page: 1, limit: 10 }
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }

      service.findAll.mockResolvedValue(expectedResult)

      const result = await controller.findAll(query)

      expect(service.findAll).toHaveBeenCalledWith(query)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("findOne", () => {
    it("should return a buyer request by id", async () => {
      const expectedResult = {
        id: "1",
        title: "Test Request",
        description: "Test Description",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: 1,
        userId: 1,
        status: BuyerRequestStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      service.findOne.mockResolvedValue(expectedResult)

      const result = await controller.findOne("1")

      expect(service.findOne).toHaveBeenCalledWith("1")
      expect(result).toEqual(expectedResult)
    })
  })

  describe("update", () => {
    it("should update a buyer request", async () => {
      const updateDto: UpdateBuyerRequestDto = { title: "Updated Title" }
      const mockRequest = { user: { id: 1 } }
      const expectedResult = {
        id: "1",
        title: "Updated Title",
        description: "Updated Description",
        budgetMin: 150,
        budgetMax: 250,
        categoryId: 2,
        userId: 1,
        status: BuyerRequestStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      service.update.mockResolvedValue(expectedResult)

      const result = await controller.update("1", updateDto, mockRequest)

      expect(service.update).toHaveBeenCalledWith("1", updateDto, 1)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("remove", () => {
    it("should remove a buyer request", async () => {
      const mockRequest = { user: { id: 1 } }

      service.remove.mockResolvedValue(undefined)

      const result = await controller.remove("1", mockRequest)

      expect(service.remove).toHaveBeenCalledWith("1", 1)
      expect(result).toBeUndefined()
    })
  })
})
