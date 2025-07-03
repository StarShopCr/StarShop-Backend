import { IsOptional, IsNumber, IsString, Min, Max } from "class-validator"
import { Transform } from "class-transformer"

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => Number.parseFloat(value))
  amount?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Transform(({ value }) => Number.parseInt(value))
  deliveryDays?: number

  @IsOptional()
  @IsString()
  notes?: string
}
