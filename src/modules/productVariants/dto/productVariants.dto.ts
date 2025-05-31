import { IsString, IsNumber, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductDTO } from '../../products/dto/product.dto';

export class ProductVariantDTO {
  @IsNumber()
  id: number;

  @ValidateNested()
  @Type(() => ProductDTO)
  product: ProductDTO;

  @IsString()
  sku: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock: number;

  @IsDate()
  createdAt: Date;
}
