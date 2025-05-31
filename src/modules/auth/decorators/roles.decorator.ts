import { SetMetadata } from '@nestjs/common';

type RoleName = 'buyer' | 'seller' | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
