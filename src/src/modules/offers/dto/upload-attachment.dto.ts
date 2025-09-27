import { IsOptional, IsString } from "class-validator"

export class UploadAttachmentDto {
  @IsOptional()
  @IsString()
  description?: string
}
