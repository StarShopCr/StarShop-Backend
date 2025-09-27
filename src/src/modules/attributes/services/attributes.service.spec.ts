import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { Attribute } from "../entities/attribute.entity"
import { AttributeValue } from "../entities/attribute-value.entity"
import { CreateAttributeDto } from "../dto/create-attribute.dto"
import { UpdateAttributeDto } from "../dto/update-attribute.dto"
import { AttributeService } from "./attributes.service"

describe("AttributeService", () => {
  let service: AttributeService
  let attributeRepository: Repository<Attribute>
  let attributeValueRepository: Repository<AttributeValue>

  const mockAttributeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  }

  const mockAttributeValueRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributeService,
        {
          provide: getRepositoryToken(Attribute),
          useValue: mockAttributeRepository,
        },
        {
          provide: getRepositoryToken(AttributeValue),
          useValue: mockAttributeValueRepository,
        },
      ],
    }).compile()

    service = module.get<AttributeService>(AttributeService)
    attributeRepository = module.get<Repository<Attribute>>(getRepositoryToken(Attribute))
    attributeValueRepository = module.get<Repository<AttributeValue>>(getRepositoryToken(AttributeValue))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create an attribute successfully", async () => {
      const createAttributeDto: CreateAttributeDto = {
        name: "Color",
        values: [{ value: "Red" }, { value: "Blue" }],
      }

      const mockAttribute = { id: 1, name: "Color", createdAt: new Date() }
      const mockSavedAttribute = { ...mockAttribute }

      mockAttributeRepository.findOne.mockResolvedValue(null)
      mockAttributeRepository.create.mockReturnValue(mockAttribute)
      mockAttributeRepository.save.mockResolvedValue(mockSavedAttribute)

      jest.spyOn(service, "findOne").mockResolvedValue({
        ...mockSavedAttribute,
        values: [],
      } as any)

      const result = await service.create(createAttributeDto)

      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({
        where: { name: "Color" },
      })
      expect(mockAttributeRepository.create).toHaveBeenCalledWith({
        name: "Color",
      })
      expect(mockAttributeRepository.save).toHaveBeenCalledWith(mockAttribute)
      expect(result).toBeDefined()
    })

    it("should throw ConflictException if attribute name already exists", async () => {
      const createAttributeDto: CreateAttributeDto = {
        name: "Color",
      }

      mockAttributeRepository.findOne.mockResolvedValue({ id: 1, name: "Color" })

      await expect(service.create(createAttributeDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("findOne", () => {
    it("should return an attribute if found", async () => {
      const mockAttribute = {
        id: 1,
        name: "Color",
        values: [],
      }

      mockAttributeRepository.findOne.mockResolvedValue(mockAttribute)

      const result = await service.findOne(1)

      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["values"],
      })
      expect(result).toEqual(mockAttribute)
    })

    it("should throw NotFoundException if attribute not found", async () => {
      mockAttributeRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException)
    })
  })

  describe("update", () => {
    it("should update an attribute successfully", async () => {
      const updateAttributeDto: UpdateAttributeDto = {
        name: "Updated Color",
      }

      const mockAttribute = {
        id: 1,
        name: "Color",
        values: [],
      }

      const mockUpdatedAttribute = {
        ...mockAttribute,
        name: "Updated Color",
      }

      jest.spyOn(service, "findOne").mockResolvedValue(mockAttribute as any)
      mockAttributeRepository.findOne.mockResolvedValue(null)
      mockAttributeRepository.save.mockResolvedValue(mockUpdatedAttribute)

      const result = await service.update(1, updateAttributeDto)

      expect(service.findOne).toHaveBeenCalledWith(1)
      expect(mockAttributeRepository.save).toHaveBeenCalled()
      expect(result).toEqual(mockUpdatedAttribute)
    })

    it("should throw ConflictException if new name already exists", async () => {
      const updateAttributeDto: UpdateAttributeDto = {
        name: "Existing Name",
      }

      const mockAttribute = {
        id: 1,
        name: "Color",
        values: [],
      }

      const mockExistingAttribute = {
        id: 2,
        name: "Existing Name",
      }

      jest.spyOn(service, "findOne").mockResolvedValue(mockAttribute as any)
      mockAttributeRepository.findOne.mockResolvedValue(mockExistingAttribute)

      await expect(service.update(1, updateAttributeDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("remove", () => {
    it("should remove an attribute successfully", async () => {
      const mockAttribute = {
        id: 1,
        name: "Color",
        values: [],
      }

      jest.spyOn(service, "findOne").mockResolvedValue(mockAttribute as any)
      mockAttributeRepository.remove.mockResolvedValue(mockAttribute)

      await service.remove(1)

      expect(service.findOne).toHaveBeenCalledWith(1)
      expect(mockAttributeRepository.remove).toHaveBeenCalledWith(mockAttribute)
    })
  })

  describe("addValue", () => {
    it("should add a value to an attribute successfully", async () => {
      const mockAttribute = {
        id: 1,
        name: "Color",
        values: [],
      }

      const mockAttributeValue = {
        id: 1,
        value: "Red",
        attributeId: 1,
      }

      jest.spyOn(service, "findOne").mockResolvedValue(mockAttribute as any)
      mockAttributeValueRepository.findOne.mockResolvedValue(null)
      mockAttributeValueRepository.create.mockReturnValue(mockAttributeValue)
      mockAttributeValueRepository.save.mockResolvedValue(mockAttributeValue)

      const result = await service.addValue(1, "Red")

      expect(service.findOne).toHaveBeenCalledWith(1)
      expect(mockAttributeValueRepository.create).toHaveBeenCalledWith({
        value: "Red",
        attributeId: 1,
      })
      expect(result).toEqual(mockAttributeValue)
    })

    it("should throw ConflictException if value already exists", async () => {
      const mockAttribute = {
        id: 1,
        name: "Color",
        values: [],
      }

      const mockExistingValue = {
        id: 1,
        value: "Red",
        attributeId: 1,
      }

      jest.spyOn(service, "findOne").mockResolvedValue(mockAttribute as any)
      mockAttributeValueRepository.findOne.mockResolvedValue(mockExistingValue)

      await expect(service.addValue(1, "Red")).rejects.toThrow(ConflictException)
    })
  })
})
