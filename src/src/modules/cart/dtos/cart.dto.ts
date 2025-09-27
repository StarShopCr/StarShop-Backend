import { IsUUID, IsInt, Min, IsDate, IsOptional, IsNumber } from 'class-validator';
import { Product } from '../../products/entities/product.entity';

export class AddItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class RemoveItemDto {
  @IsUUID()
  productId: string;
}

export class CartItemResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  product?: Product;
}

export class CartResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  discountedTotal?: number;

  items: CartItemResponseDto[];
}
