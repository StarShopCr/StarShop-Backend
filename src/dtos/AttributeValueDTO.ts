// src/dtos/attributeValue.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttributeDTO } from './AttributeDTO';

export class CreateAttributeValueDto {
  @IsString()
  @MinLength(1, { message: 'Value cannot be empty' })
  @MaxLength(255, { message: 'Value cannot be longer than 255 characters' })
  value: string;

  @IsNumber()
  attributeId: number;
}

export class UpdateAttributeValueDto {
  @IsString()
  @MinLength(1, { message: 'Value cannot be empty' })
  @MaxLength(255, { message: 'Value cannot be longer than 255 characters' })
  @IsOptional()
  value?: string;

  @IsNumber()
  @IsOptional()
  attributeId?: number;
}

export class GetAttributeValuesQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

export class AttributeValueDTO {
  @IsNumber()
  id: number;

  @ValidateNested()
  @Type(() => AttributeDTO)
  attribute: AttributeDTO;

  @IsString()
  value: string;

  @IsDate()
  createdAt: Date;
}
