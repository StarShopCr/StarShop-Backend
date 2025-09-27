import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [ConfigModule.forRoot(), SharedModule],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationsModule {}
