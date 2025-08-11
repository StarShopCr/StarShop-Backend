import { IsString, IsOptional, Matches, IsNotEmpty, IsEmail, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StellarWalletLoginDto {
  @ApiProperty({
    description: 'Stellar wallet address (must start with G and be 56 characters long)',
    example: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
    pattern: '^G[A-Z2-7]{55}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/, { message: 'Invalid Stellar wallet address format' })
  walletAddress: string;
}

export class RegisterUserDto {
  @ApiProperty({
    description: 'Stellar wallet address (must start with G and be 56 characters long)',
    example: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
    pattern: '^G[A-Z2-7]{55}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/, { message: 'Invalid Stellar wallet address format' })
  walletAddress: string;

  @ApiProperty({
    description: 'User role (buyer or seller)',
    example: 'buyer',
    enum: ['buyer', 'seller'],
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(buyer|seller)$/, { message: 'Role must be either "buyer" or "seller"' })
  role: 'buyer' | 'seller';

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'User location',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'User country',
    example: 'United States',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Buyer-specific data (only required if role is buyer)',
    example: { preferences: ['electronics', 'books'] },
  })
  @IsObject()
  @IsOptional()
  buyerData?: any;

  @ApiPropertyOptional({
    description: 'Seller-specific data (only required if role is seller)',
    example: { businessName: 'Tech Store', categories: ['electronics'], rating: 4.5 },
  })
  @IsObject()
  @IsOptional()
  sellerData?: any;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'User location',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'User country',
    example: 'United States',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Buyer-specific data',
    example: { preferences: ['electronics', 'books'] },
  })
  @IsObject()
  @IsOptional()
  buyerData?: any;

  @ApiPropertyOptional({
    description: 'Seller-specific data',
    example: { businessName: 'Tech Store', categories: ['electronics'], rating: 4.5 },
  })
  @IsObject()
  @IsOptional()
  sellerData?: any;
}

export class ChallengeDto {
  @ApiProperty({
    description: 'Stellar wallet address to generate challenge for',
    example: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
    pattern: '^G[A-Z2-7]{55}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/, { message: 'Invalid Stellar wallet address format' })
  walletAddress: string;
}
