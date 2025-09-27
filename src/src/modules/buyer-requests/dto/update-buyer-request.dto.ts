import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsPositive,
  IsDateString,
} from "class-validator"
import { Transform } from "class-transformer"

export class UpdateBuyerRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Title must not exceed 100 characters" })
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber({}, { message: "Budget minimum must be a valid number" })
  @Min(0, { message: "Budget minimum must be at least 0" })
  @IsPositive({ message: "Budget minimum must be positive" })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMin?: number

  @IsOptional()
  @IsNumber({}, { message: "Budget maximum must be a valid number" })
  @Min(0, { message: "Budget maximum must be at least 0" })
  @IsPositive({ message: "Budget maximum must be positive" })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMax?: number

  @IsOptional()
  @IsNumber({}, { message: "Category ID must be a valid number" })
  @IsPositive({ message: "Category ID must be positive" })
  @Transform(({ value }) => Number.parseInt(value))
  categoryId?: number

  @IsOptional()
  @IsDateString({}, { message: "Expires at must be a valid date" })
  expiresAt?: string
}
