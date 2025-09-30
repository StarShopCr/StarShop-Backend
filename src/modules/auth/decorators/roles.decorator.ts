import { SetMetadata } from '@nestjs/common';

type RoleName = 'buyer' | 'seller' | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
