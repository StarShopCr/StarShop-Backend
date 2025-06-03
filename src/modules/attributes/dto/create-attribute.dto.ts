import { IsString, MinLength, MaxLength, IsOptional, IsArray, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateAttributeValueDto {
  @ApiProperty({
    description: "The value for the attribute",
    example: "Red",
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: "Value must be a string" })
  @MinLength(1, { message: "Value must be at least 1 character long" })
  @MaxLength(100, { message: "Value cannot be longer than 100 characters" })
  value: string
}

export class CreateAttributeDto {
  @ApiProperty({
    description: "The name of the attribute",
    example: "Color",
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: "Name must be a string" })
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @MaxLength(50, { message: "Name cannot be longer than 50 characters" })
  name: string

  @ApiPropertyOptional({
    description: "Initial values for the attribute",
    type: [CreateAttributeValueDto],
    example: [{ value: "Red" }, { value: "Blue" }, { value: "Green" }],
  })
  @IsOptional()
  @IsArray({ message: "Values must be an array" })
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeValueDto)
  values?: CreateAttributeValueDto[]
}
