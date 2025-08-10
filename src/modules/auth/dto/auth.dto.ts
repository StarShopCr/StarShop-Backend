import { IsString, IsOptional, Matches, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CountryCode } from '@/modules/users/enums/country-code.enum';
import { Transform } from 'class-transformer';

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

  @ApiProperty({
    description: "Country code of the buyer request",
    example: "US",
    enum: CountryCode,
    enumName: 'CountryCode'
  })
  @Transform(({ value }) => value?.toUpperCase())
  @IsOptional()
  @IsString()
  @IsEnum(CountryCode, { message: 'Country must be a valid ISO 3166-1 alpha-2 country code' })
  country?: string;
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
