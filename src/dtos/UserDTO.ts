import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/, { message: 'Invalid wallet address format' })
  walletAddress: string;

  @IsOptional()
  @MinLength(2, { message: 'Name is too short' })
  @MaxLength(50, { message: 'Name is too long' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsNotEmpty()
  @IsEnum(['buyer', 'seller', 'admin'], { message: 'Role must be buyer, seller, or admin' })
  role: 'buyer' | 'seller' | 'admin';

  @IsOptional()
  @MaxLength(100, { message: 'Location is too long' })
  location?: string;

  @IsOptional()
  @MaxLength(100, { message: 'Country is too long' })
  country?: string;

  @ApiPropertyOptional({
    description: 'Buyer-specific data',
    example: { preferences: ['electronics', 'books'] },
  })
  @IsObject()
  @IsOptional()
  buyerData?: any;

  @IsOptional()
  @IsObject({ message: 'Seller data must be an object' })
  sellerData?: any;
}

export class UpdateUserDto {
  @IsOptional()
  @MinLength(2, { message: 'Name is too short' })
  @MaxLength(50, { message: 'Name is too long' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsEnum(['buyer', 'seller', 'admin'], { message: 'Role must be buyer, seller, or admin' })
  role?: 'buyer' | 'seller' | 'admin';
}
