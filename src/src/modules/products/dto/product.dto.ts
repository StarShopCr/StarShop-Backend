import { IsString, IsNumber, IsDate, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductTypeDTO } from '../../productTypes/dto/productTypes.dto';

export class ProductDTO {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => ProductTypeDTO)
  productType: ProductTypeDTO;

  @IsDate()
  createdAt: Date;
}
