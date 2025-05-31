import { IsUUID, IsInt, Min } from 'class-validator';

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
  id: string;
  productId: string;
  quantity: number;
  product?: any;
}

export class CartResponseDto {
  id: string;
  userId: string;
  createdAt: Date;
  items: CartItemResponseDto[];
}
