import { IsString, IsNotEmpty, IsIn, IsOptional, IsObject } from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(['info', 'warning', 'error', 'offer', 'offer_accepted', 'offer_rejected'])
  type: 'info' | 'warning' | 'error' | 'offer' | 'offer_accepted' | 'offer_rejected';

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsString()
  entityId?: string;
}

export class UserNotificationDto extends NotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  entityType?: string; // Para saber qué tipo de entidad es (offer, order, etc.)
}