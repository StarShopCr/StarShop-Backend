import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../services/role.service';

type RoleName = 'buyer' | 'seller' | 'admin';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<RoleName[]>('roles', context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.id) {
      throw new UnauthorizedException('User ID not found in token');
    }

    return this.roleService.hasAnyRole(user.id, requiredRoles);
  }
}
