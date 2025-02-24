import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid wallet address format' })
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
