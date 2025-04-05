import { IsString, IsNumber, IsOptional, MinLength, MaxLength, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeDTO {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsDate()
  createdAt: Date;
}

export class CreateAttributeDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name cannot be longer than 50 characters' })
  name: string;
}

export class UpdateAttributeDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name cannot be longer than 50 characters' })
  @IsOptional()
  name?: string;
}

export class GetAttributesQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
