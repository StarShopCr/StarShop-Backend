import { IsNumber, IsOptional, IsString, Min } from "class-validator"
import { Type } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"

export class GetAttributesQueryDto {
  @ApiPropertyOptional({
    description: "Number of attributes to return",
    example: 10,
    minimum: 1,
  })
  @IsNumber({}, { message: "Limit must be a number" })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: "Limit must be at least 1" })
  limit?: number = 10

  @ApiPropertyOptional({
    description: "Number of attributes to skip",
    example: 0,
    minimum: 0,
  })
  @IsNumber({}, { message: "Offset must be a number" })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: "Offset must be at least 0" })
  offset?: number = 0

  @ApiPropertyOptional({
    description: "Search term for attribute names",
    example: "color",
  })
  @IsString({ message: "Search must be a string" })
  @IsOptional()
  search?: string
}
