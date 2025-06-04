import { IsUUID } from 'class-validator';

export class RemoveFromWishlistDto {
  @IsUUID()
  productId: string;
}