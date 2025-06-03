import { IsString, MinLength, MaxLength, IsOptional } from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"

export class UpdateAttributeDto {
  @ApiPropertyOptional({
    description: "The name of the attribute",
    example: "Color",
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: "Name must be a string" })
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @MaxLength(50, { message: "Name cannot be longer than 50 characters" })
  @IsOptional()
  name?: string
}
