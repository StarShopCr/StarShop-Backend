import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class ProductTypeDTO {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  createdAt: Date;
}
