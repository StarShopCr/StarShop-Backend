import { Test, type TestingModule } from "@nestjs/testing"
import { CreateAttributeDto } from "../dto/create-attribute.dto"
import { UpdateAttributeDto } from "../dto/update-attribute.dto"
import { GetAttributesQueryDto } from "../dto/get-attributes-query.dto"
import { AttributeController } from "./attributes.controller"
import { AttributeService } from "../services/attributes.service"

describe("AttributeController", () => {
  let controller: AttributeController
  let service: AttributeService

  const mockAttributeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addValue: jest.fn(),
    getAttributeValues: jest.fn(),
    removeValue: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributeController],
      providers: [
        {
          provide: AttributeService,
          useValue: mockAttributeService,
        },
      ],
    }).compile()

    controller = module.get<AttributeController>(AttributeController)
    service = module.get<AttributeService>(AttributeService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create an attribute", async () => {
      const createAttributeDto: CreateAttributeDto = {
        name: "Color",
        values: [{ value: "Red" }],
      }

      const mockResult = {
        id: 1,
        name: "Color",
        createdAt: new Date(),
        updatedAt: new Date(),
        values: [{ id: 1, value: "Red", attributeId: 1 }],
      }

      mockAttributeService.create.mockResolvedValue(mockResult)

      const result = await controller.create(createAttributeDto)

      expect(service.create).toHaveBeenCalledWith(createAttributeDto)
      expect(result).toEqual(mockResult)
    })
  })

  describe("findAll", () => {
    it("should return paginated attributes", async () => {
      const query: GetAttributesQueryDto = {
        limit: 10,
        offset: 0,
      }

      const mockResult = {
        data: [
          {
            id: 1,
            name: "Color",
            createdAt: new Date(),
            updatedAt: new Date(),
            values: [],
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      }

      mockAttributeService.findAll.mockResolvedValue(mockResult)

      const result = await controller.findAll(query)

      expect(service.findAll).toHaveBeenCalledWith(query)
      expect(result).toEqual(mockResult)
    })
  })

  describe("findOne", () => {
    it("should return a single attribute", async () => {
      const mockResult = {
        id: 1,
        name: "Color",
        createdAt: new Date(),
        updatedAt: new Date(),
        values: [],
      }

      mockAttributeService.findOne.mockResolvedValue(mockResult)

      const result = await controller.findOne(1)

      expect(service.findOne).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockResult)
    })
  })

  describe("update", () => {
    it("should update an attribute", async () => {
      const updateAttributeDto: UpdateAttributeDto = {
        name: "Updated Color",
      }

      const mockResult = {
        id: 1,
        name: "Updated Color",
        createdAt: new Date(),
        updatedAt: new Date(),
        values: [],
      }

      mockAttributeService.update.mockResolvedValue(mockResult)

      const result = await controller.update(1, updateAttributeDto)

      expect(service.update).toHaveBeenCalledWith(1, updateAttributeDto)
      expect(result).toEqual(mockResult)
    })
  })

  describe("remove", () => {
    it("should remove an attribute", async () => {
      mockAttributeService.remove.mockResolvedValue(undefined)

      await controller.remove(1)

      expect(service.remove).toHaveBeenCalledWith(1)
    })
  })

  describe("addValue", () => {
    it("should add a value to an attribute", async () => {
      const mockResult = {
        id: 1,
        value: "Red",
        attributeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockAttributeService.addValue.mockResolvedValue(mockResult)

      const result = await controller.addValue(1, "Red")

      expect(service.addValue).toHaveBeenCalledWith(1, "Red")
      expect(result).toEqual(mockResult)
    })
  })

  describe("getValues", () => {
    it("should return attribute values", async () => {
      const mockResult = [
        {
          id: 1,
          value: "Red",
          attributeId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockAttributeService.getAttributeValues.mockResolvedValue(mockResult)

      const result = await controller.getValues(1)

      expect(service.getAttributeValues).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockResult)
    })
  })

  describe("removeValue", () => {
    it("should remove a value from an attribute", async () => {
      mockAttributeService.removeValue.mockResolvedValue(undefined)

      await controller.removeValue(1, 1)

      expect(service.removeValue).toHaveBeenCalledWith(1, 1)
    })
  })
})
