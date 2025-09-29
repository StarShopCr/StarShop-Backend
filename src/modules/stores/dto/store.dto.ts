import { IsString, IsOptional, IsArray, IsUrl, IsNumber, IsBoolean, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreStatus } from '../entities/store.entity';

export class ContactInfoDto {
  @ApiPropertyOptional({ description: 'Store phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Store email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Store website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  @IsObject()
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export class AddressDto {
  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Geographic coordinates' })
  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export class BusinessHoursDto {
  @ApiPropertyOptional({ description: 'Monday business hours' })
  @IsOptional()
  @IsObject()
  monday?: { open: string; close: string; closed: boolean };

  @ApiPropertyOptional({ description: 'Tuesday business hours' })
  @IsOptional()
  @IsObject()
  tuesday?: { open: string; close: string; closed: boolean };

  @ApiPropertyOptional({ description: 'Wednesday business hours' })
  @IsOptional()
  @IsObject()
  wednesday?: { open: string; close: string; closed: boolean };

  @ApiPropertyOptional({ description: 'Thursday business hours' })
  @IsOptional()
  @IsObject()
  thursday?: { open: string; close: string; closed: boolean };

  @ApiPropertyOptional({ description: 'Friday business hours' })
  @IsOptional()
  @IsObject()
  friday?: { open: string; close: string; closed: boolean };

  @ApiPropertyOptional({ description: 'Saturday business hours' })
  @IsOptional()
  @IsObject()
  saturday?: { open: string; close: string; closed: boolean };

  @ApiPropertyOptional({ description: 'Sunday business hours' })
  @IsOptional()
  @IsObject()
  sunday?: { open: string; close: string; closed: boolean };
}

export class PoliciesDto {
  @ApiPropertyOptional({ description: 'Return policy' })
  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @ApiPropertyOptional({ description: 'Shipping policy' })
  @IsOptional()
  @IsString()
  shippingPolicy?: string;

  @ApiPropertyOptional({ description: 'Privacy policy' })
  @IsOptional()
  @IsString()
  privacyPolicy?: string;

  @ApiPropertyOptional({ description: 'Terms of service' })
  @IsOptional()
  @IsString()
  termsOfService?: string;
}

export class StoreSettingsDto {
  @ApiPropertyOptional({ description: 'Auto-approve reviews' })
  @IsOptional()
  @IsBoolean()
  autoApproveReviews?: boolean;

  @ApiPropertyOptional({ description: 'Email notifications' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'SMS notifications' })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Push notifications' })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}

export class CreateStoreDto {
  @ApiProperty({ description: 'Store name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Store description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Store logo URL' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ description: 'Store banner URL' })
  @IsOptional()
  @IsUrl()
  banner?: string;

  @ApiPropertyOptional({ description: 'Contact information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;

  @ApiPropertyOptional({ description: 'Store address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Business hours' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours?: BusinessHoursDto;

  @ApiPropertyOptional({ description: 'Store categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Store tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Store policies' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PoliciesDto)
  policies?: PoliciesDto;

  @ApiPropertyOptional({ description: 'Store settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreSettingsDto)
  settings?: StoreSettingsDto;
}

export class UpdateStoreDto extends CreateStoreDto {
  @ApiPropertyOptional({ description: 'Store status' })
  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;

  @ApiPropertyOptional({ description: 'Verification status' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Featured status' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class StoreResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  banner?: string;

  @ApiPropertyOptional()
  contactInfo?: ContactInfoDto;

  @ApiPropertyOptional()
  address?: AddressDto;

  @ApiPropertyOptional()
  businessHours?: BusinessHoursDto;

  @ApiPropertyOptional()
  categories?: string[];

  @ApiPropertyOptional()
  tags?: string[];

  @ApiPropertyOptional()
  rating?: number;

  @ApiProperty()
  reviewCount: number;

  @ApiPropertyOptional()
  policies?: PoliciesDto;

  @ApiPropertyOptional()
  settings?: StoreSettingsDto;

  @ApiProperty()
  status: StoreStatus;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiPropertyOptional()
  featuredAt?: Date;

  @ApiProperty()
  sellerId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
