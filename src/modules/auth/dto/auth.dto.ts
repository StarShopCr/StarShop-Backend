import { 
  IsString, 
  IsOptional, 
  Matches, 
  IsNotEmpty, 
  IsEmail, 
  IsObject, 
  IsEnum, 
  registerDecorator, 
  ValidationOptions, 
  ValidationArguments 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CountryCode } from '@/modules/users/enums/country-code.enum';

// Custom validator to ensure role-specific data rules
function IsRoleSpecificData(validationOptions?: ValidationOptions) {
  return function (object: Record<string, unknown>, propertyName: string) {
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

  @ApiPropertyOptional({
    description: 'User location',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  location?: string;

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
