import { IsString, IsOptional, MaxLength, IsNumber, IsPositive } from "class-validator"
import { Transform } from "class-transformer"

export class UpdateBuyerRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: "Title must not exceed 100 characters" })
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber({}, { message: "Budget minimum must be a valid number" })
  @IsPositive({ message: "Budget minimum must be positive" })
  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMin?: number

  @IsNumber({}, { message: "Budget maximum must be a valid number" })
  @IsPositive({ message: "Budget maximum must be positive" })
  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMax?: number

  @IsNumber({}, { message: "Category ID must be a valid number" })
  @IsPositive({ message: "Category ID must be positive" })
  @IsOptional()
  categoryId?: number
}
