import { IsUUID } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  productId: string;
}