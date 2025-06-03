import { ApiProperty } from "@nestjs/swagger"
import { Expose, Type } from "class-transformer"

export class AttributeValueResponseDto {
  @ApiProperty({ description: "The ID of the attribute value" })
  @Expose()
  id: number

  @ApiProperty({ description: "The value" })
  @Expose()
  value: string

  @ApiProperty({ description: "Creation date" })
  @Expose()
  createdAt: Date
}

export class AttributeResponseDto {
  @ApiProperty({ description: "The ID of the attribute" })
  @Expose()
  id: number

  @ApiProperty({ description: "The name of the attribute" })
  @Expose()
  name: string

  @ApiProperty({ description: "Creation date" })
  @Expose()
  createdAt: Date

  @ApiProperty({ description: "Last update date" })
  @Expose()
  updatedAt: Date

  @ApiProperty({
    description: "Attribute values",
    type: [AttributeValueResponseDto],
    required: false,
  })
  @Expose()
  @Type(() => AttributeValueResponseDto)
  values?: AttributeValueResponseDto[]
}

export class PaginatedAttributesResponseDto {
  @ApiProperty({ type: [AttributeResponseDto] })
  @Expose()
  @Type(() => AttributeResponseDto)
  data: AttributeResponseDto[]

  @ApiProperty({ description: "Total number of attributes" })
  @Expose()
  total: number

  @ApiProperty({ description: "Current page limit" })
  @Expose()
  limit: number

  @ApiProperty({ description: "Current page offset" })
  @Expose()
  offset: number
}
