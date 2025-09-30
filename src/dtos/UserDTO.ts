import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
  MinLength,
  MaxLength,
  IsObject,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Custom validator to ensure role-specific data rules
function IsRoleSpecificData(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: Record<string, unknown>, propertyName: string): void {
    registerDecorator({
      name: 'isRoleSpecificData',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const obj = args.object as Record<string, unknown>;
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
    description: 'Buyer-specific data (only allowed if role is buyer)',
    example: { preferences: ['electronics', 'books'] },
  })
  @IsRoleSpecificData({ message: 'buyerData is only allowed for buyers' })
  @IsObject({ message: 'Buyer data must be an object' })
  @IsOptional()
  buyerData?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Seller-specific data (only allowed if role is seller)',
    example: { businessName: 'Tech Store', categories: ['electronics'] },
  })
  @IsRoleSpecificData({ message: 'sellerData is only allowed for sellers' })
  @IsObject({ message: 'Seller data must be an object' })
  @IsOptional()
  sellerData?: Record<string, unknown>;
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
