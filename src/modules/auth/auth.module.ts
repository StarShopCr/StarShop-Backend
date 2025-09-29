import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from '../users/entities/user.entity';

import { RoleService } from './services/role.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { RoleController } from './controllers/role.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UserRole, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') || '1h' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
    StoresModule,
  ],
  controllers: [AuthController, RoleController],
  providers: [AuthService, RoleService, JwtAuthGuard, RolesGuard, JwtStrategy],
  exports: [AuthService, RoleService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
