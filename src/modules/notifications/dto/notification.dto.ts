import { IsString, IsNotEmpty, IsIn, IsOptional, IsObject } from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(['info', 'warning', 'error', 'offer'])
  type: 'info' | 'warning' | 'error' | 'offer';

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class UserNotificationDto extends NotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
