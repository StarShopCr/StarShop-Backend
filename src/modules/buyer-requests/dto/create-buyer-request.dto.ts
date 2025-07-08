import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsPositive,
} from "class-validator"
import { Transform } from "class-transformer"
import { ApiProperty } from "@nestjs/swagger"

export class CreateBuyerRequestDto {
  @ApiProperty({ description: "Title of the buyer request", maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: "Title is required" })
  @MaxLength(100, { message: "Title must not exceed 100 characters" })
  title: string

  @ApiProperty({ description: "Detailed description of what the buyer is looking for", required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: "Minimum budget", example: 100, minimum: 0 })
  @IsNumber({}, { message: "Budget minimum must be a valid number" })
  @Min(0, { message: "Budget minimum must be at least 0" })
  @IsPositive({ message: "Budget minimum must be positive" })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMin: number

  @ApiProperty({ description: "Maximum budget", example: 500, minimum: 0 })
  @IsNumber({}, { message: "Budget maximum must be a valid number" })
  @Min(0, { message: "Budget maximum must be at least 0" })
  @IsPositive({ message: "Budget maximum must be positive" })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMax: number

  @ApiProperty({ description: "ID of the product category", example: 3 })
  @IsNumber({}, { message: "Category ID must be a valid number" })
  @IsPositive({ message: "Category ID must be positive" })
  @Transform(({ value }) => Number.parseInt(value))
  categoryId: number

  @ApiProperty({ description: "Expiration date", required: false })
  @IsOptional()
  @IsDateString({}, { message: "Expires at must be a valid date" })
  expiresAt?: string
}
