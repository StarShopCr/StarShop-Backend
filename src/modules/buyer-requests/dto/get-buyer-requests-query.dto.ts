import { IsOptional, IsString, IsNumber, Min, Max } from "class-validator"
import { Transform } from "class-transformer"

export class GetBuyerRequestsQueryDto {
  @IsOptional()
  @IsNumber({}, { message: "Page must be a valid number" })
  @Min(1, { message: "Page must be at least 1" })
  @Transform(({ value }) => Number.parseInt(value))
  page?: number = 1

  @IsOptional()
  @IsNumber({}, { message: "Limit must be a valid number" })
  @Min(1, { message: "Limit must be at least 1" })
  @Max(100, { message: "Limit must not exceed 100" })
  @Transform(({ value }) => Number.parseInt(value))
  limit?: number = 10

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsNumber({}, { message: "Category ID must be a valid number" })
  @Transform(({ value }) => Number.parseInt(value))
  categoryId?: number

  @IsOptional()
  @IsNumber({}, { message: "Min budget must be a valid number" })
  @Transform(({ value }) => Number.parseFloat(value))
  minBudget?: number

  @IsOptional()
  @IsNumber({}, { message: "Max budget must be a valid number" })
  @Transform(({ value }) => Number.parseFloat(value))
  maxBudget?: number
}
