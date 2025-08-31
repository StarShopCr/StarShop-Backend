import { IsString, IsOptional, Matches, IsNotEmpty, IsEmail, IsObject, Validate, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Custom validator to ensure role-specific data rules
function IsRoleSpecificData(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRoleSpecificData',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const role = obj.role;
          
          if (propertyName === 'buyerData') {
            // buyerData is only allowed for buyers
            if (role !== 'buyer' && value !== undefined) {
              return false;
            }
          }
          
          if (propertyName === 'sellerData') {
            // sellerData is only allowed for sellers
            if (role !== 'seller' && value !== undefined) {
              return false;
            }
          }
          
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          if (args.property === 'buyerData') {
            return 'buyerData is only allowed for buyers';
          }
          if (args.property === 'sellerData') {
            return 'sellerData is only allowed for sellers';
          }
          return 'Invalid role-specific data';
        }
      }
    });
  };
}

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
    description: 'Buyer-specific data (only allowed if role is buyer)',
    example: { preferences: ['electronics', 'books'] },
  })
  @IsRoleSpecificData({ message: 'buyerData is only allowed for buyers' })
  @IsObject()
  @IsOptional()
  buyerData?: any;

  @ApiPropertyOptional({
    description: 'Seller-specific data (only allowed if role is seller)',
    example: { businessName: 'Tech Store', categories: ['electronics'], rating: 4.5 },
  })
  @IsRoleSpecificData({ message: 'sellerData is only allowed for sellers' })
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
    description: 'Buyer-specific data (only allowed if role is buyer)',
    example: { preferences: ['electronics', 'books'] },
  })
  @IsRoleSpecificData({ message: 'buyerData is only allowed for buyers' })
  @IsObject()
  @IsOptional()
  buyerData?: any;

  @ApiPropertyOptional({
    description: 'Seller-specific data (only allowed if role is seller)',
    example: { businessName: 'Tech Store', categories: ['electronics'], rating: 4.5 },
  })
  @IsRoleSpecificData({ message: 'sellerData is only allowed for sellers' })
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

export class LoginDto {
  @ApiProperty({
    description:
      'Stellar wallet address (must start with G and be 56 characters long in Base32)',
    example:
      'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
    pattern: '^G[A-Z2-7]{55}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'Invalid Stellar wallet address format',
  })
  walletAddress!: string;

  @ApiProperty({
    description:
      'Challenge was signed by the user (exact string that was signed)',
    example:
      'Login challenge: nonce=2c9f5e1c-1b2a-4b8a-9d7f-3a6e5c4b2a10; ts=1724300000',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    description:
      'Message signed in Base64 using the Stellar wallet private key',
    example:
      'MEUCIQDj4N1mN1k5m7Xy1rP1wq1mJm+2b5Z4sQF1m5J9Dkq8gQIgQv8i3f7P/9yJQ9a9m3Fz0wW0kZpOeCqP5l3m8r1s2aA=',
    pattern: '^[A-Za-z0-9+/=]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9+/=]+$/, {
    message: 'Signature must be Base64-encoded',
  })
  signature!: string;
}
