import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Attribute } from "../entities/attribute.entity"
import { AttributeValue } from "../entities/attribute-value.entity"
import { CreateAttributeDto } from "../dto/create-attribute.dto"
import { UpdateAttributeDto } from "../dto/update-attribute.dto"
import { GetAttributesQueryDto } from "../dto/get-attributes-query.dto"
import { PaginatedAttributesResponseDto } from "../dto/attribute-response.dto"

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
  ) {}

  async create(createAttributeDto: CreateAttributeDto): Promise<Attribute> {
    const { name, values } = createAttributeDto

    // Check if attribute with this name already exists
    const existingAttribute = await this.attributeRepository.findOne({
      where: { name },
    })

    if (existingAttribute) {
      throw new ConflictException(`Attribute with name '${name}' already exists`)
    }

    // Create the attribute
    const attribute = this.attributeRepository.create({ name })
    const savedAttribute = await this.attributeRepository.save(attribute)

    // Create attribute values if provided
    if (values && values.length > 0) {
      const attributeValues = values.map((valueDto) =>
        this.attributeValueRepository.create({
          value: valueDto.value,
          attributeId: savedAttribute.id,
        }),
      )

      await this.attributeValueRepository.save(attributeValues)
    }

    // Return the attribute with its values
    return this.findOne(savedAttribute.id)
  }

  async findAll(query: GetAttributesQueryDto): Promise<PaginatedAttributesResponseDto> {
    const { limit = 10, offset = 0, search } = query

    const queryBuilder = this.attributeRepository
      .createQueryBuilder("attribute")
      .leftJoinAndSelect("attribute.values", "values")
      .orderBy("attribute.createdAt", "DESC")

    if (search) {
      queryBuilder.where("attribute.name ILIKE :search", {
        search: `%${search}%`,
      })
    }

    const [attributes, total] = await queryBuilder.skip(offset).take(limit).getManyAndCount()

    return {
      data: attributes,
      total,
      limit,
      offset,
    }
  }

  async findOne(id: number): Promise<Attribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      relations: ["values"],
    })

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`)
    }

    return attribute
  }

  async findByName(name: string): Promise<Attribute | null> {
    return this.attributeRepository.findOne({
      where: { name },
      relations: ["values"],
    })
  }

  async update(id: number, updateAttributeDto: UpdateAttributeDto): Promise<Attribute> {
    const attribute = await this.findOne(id)

    if (updateAttributeDto.name && updateAttributeDto.name !== attribute.name) {
      // Check if another attribute with this name exists
      const existingAttribute = await this.attributeRepository.findOne({
        where: { name: updateAttributeDto.name },
      })

      if (existingAttribute && existingAttribute.id !== id) {
        throw new ConflictException(`Attribute with name '${updateAttributeDto.name}' already exists`)
      }
    }

    Object.assign(attribute, updateAttributeDto)
    return this.attributeRepository.save(attribute)
  }

  async remove(id: number): Promise<void> {
    const attribute = await this.findOne(id)
    await this.attributeRepository.remove(attribute)
  }

  async addValue(attributeId: number, value: string): Promise<AttributeValue> {
    const attribute = await this.findOne(attributeId)

    // Check if value already exists for this attribute
    const existingValue = await this.attributeValueRepository.findOne({
      where: { attributeId, value },
    })

    if (existingValue) {
      throw new ConflictException(`Value '${value}' already exists for this attribute`)
    }

    const attributeValue = this.attributeValueRepository.create({
      value,
      attributeId,
    })

    return this.attributeValueRepository.save(attributeValue)
  }

  async removeValue(attributeId: number, valueId: number): Promise<void> {
    const attributeValue = await this.attributeValueRepository.findOne({
      where: { id: valueId, attributeId },
    })

    if (!attributeValue) {
      throw new NotFoundException(`Attribute value with ID ${valueId} not found for attribute ${attributeId}`)
    }

    await this.attributeValueRepository.remove(attributeValue)
  }

  async getAttributeValues(attributeId: number): Promise<AttributeValue[]> {
    await this.findOne(attributeId) // Ensure attribute exists

    return this.attributeValueRepository.find({
      where: { attributeId },
      order: { createdAt: "ASC" },
    })
  }
}
