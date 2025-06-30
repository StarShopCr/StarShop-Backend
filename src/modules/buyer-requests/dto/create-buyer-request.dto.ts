import { IsString, IsNotEmpty, MaxLength, IsNumber, Min, IsOptional, IsDateString } from "class-validator"
import { Transform } from "class-transformer"

export class CreateBuyerRequestDto {
  @IsString()
  @IsNotEmpty({ message: "Title is required" })
  @MaxLength(100, { message: "Title must not exceed 100 characters" })
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber({}, { message: "Budget minimum must be a valid number" })
  @Min(0, { message: "Budget minimum must be at least 0" })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMin: number

  @IsNumber({}, { message: "Budget maximum must be a valid number" })
  @Min(0, { message: "Budget maximum must be at least 0" })
  @Transform(({ value }) => Number.parseFloat(value))
  budgetMax: number

  @IsNumber({}, { message: "Category ID must be a valid number" })
  @Transform(({ value }) => Number.parseInt(value))
  categoryId: number

  @IsOptional()
  @IsDateString({}, { message: "Expires at must be a valid date" })
  expiresAt?: string
}
