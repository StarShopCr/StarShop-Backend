import { Controller, Post, Body, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { NotificationDto, UserNotificationDto } from '../dto/notification.dto';
import { Role } from '../../../types/role';
import { AuthenticatedRequest } from '../../shared/types/auth-request.type';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private isAdmin(req: AuthenticatedRequest): boolean {
    if (!req.user) return false;
    const userRole = req.user.role;
    if (Array.isArray(userRole)) {
      return userRole.some((role) => role === Role.ADMIN);
    }
    return userRole === Role.ADMIN;
  }

  @Post('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send notification to a user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendToUser(@Body() data: UserNotificationDto, @Request() req: AuthenticatedRequest) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Only admins can send notifications');
    }
    const success = await this.notificationService.sendNotificationToUser(data);
    return {
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification',
    };
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast notification to all users' })
  @ApiResponse({ status: 200, description: 'Notification broadcasted successfully' })
  async broadcast(@Body() data: NotificationDto, @Request() req: AuthenticatedRequest) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Only admins can broadcast notifications');
    }
    const success = await this.notificationService.broadcastNotification(data);
    return {
      success,
      message: success
        ? 'Notification broadcasted successfully'
        : 'Failed to broadcast notification',
    };
  }
}
