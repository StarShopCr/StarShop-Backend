import { IsNumber, IsDate, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductVariantDTO } from './ProductVariantDTO';
import { AttributeValueDTO } from './AttributeValueDTO';

export class CreateProductVariantAttributeDto {
  @IsNumber()
  productVariantId: number;

  @IsNumber()
  attributeValueId: number;
}

export class UpdateProductVariantAttributeDto {
  @IsNumber()
  @IsOptional()
  productVariantId?: number;

  @IsNumber()
  @IsOptional()
  attributeValueId?: number;
}

export class ProductVariantAttributeDTO {
    @IsNumber()
    id: number;

    @ValidateNested()
    @Type(() => ProductVariantDTO)
    productVariant: ProductVariantDTO;

    @ValidateNested()
    @Type(() => AttributeValueDTO)
    attributeValue: AttributeValueDTO;

    @IsDate()
    createdAt: Date;
} 