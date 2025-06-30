import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from "class-validator"
import { Transform } from "class-transformer"

export class CreateOfferDto {
  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => Number.parseFloat(value))
  amount: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Transform(({ value }) => Number.parseInt(value))
  deliveryDays?: number = 7

  @IsOptional()
  @IsString()
  notes?: string

  @IsNotEmpty()
  @IsString()
  buyerRequestId: string
}
