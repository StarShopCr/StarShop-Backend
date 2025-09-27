import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../services/role.service';
import { ForbiddenError } from '../utils/errors';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenError('User not authenticated');
    }

    const userRoles = await this.roleService.getUserRoles(user.id);
    const hasRole = requiredRoles.some((requiredRole) =>
      userRoles.some((userRole) => userRole.name === requiredRole)
    );

    if (!hasRole) {
      throw new ForbiddenError('User does not have required role');
    }

    return true;
  }
}
