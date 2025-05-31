import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(['info', 'warning', 'error'])
  type: 'info' | 'warning' | 'error';
}

export class UserNotificationDto extends NotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
