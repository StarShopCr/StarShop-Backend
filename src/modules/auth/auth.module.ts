import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from '../../entities/User';

import { RoleService } from './services/role.service';
import { AuthService } from './services/auth.service';
import { RoleController } from './controllers/role.controller';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UserRole, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') || '1d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RoleController],
  providers: [AuthService, RoleService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, RoleService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
