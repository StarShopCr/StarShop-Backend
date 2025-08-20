import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { SharedModule } from '../shared/shared.module'; // ✅ Importar SharedModule para RoleService

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    JwtModule, // ✅ Para JwtAuthGuard
    SharedModule, // ✅ Para RoleService (usado por RolesGuard)
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService], // Para que otros módulos puedan usar el servicio
})
export class NotificationsModule {}