import { Injectable } from '@nestjs/common';
import { AppDataSource } from '../../../config/database';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/entities/user-role.entity';

type RoleName = 'buyer' | 'seller' | 'admin';

@Injectable()
export class RoleService {
  private get roleRepository() {
    return AppDataSource.getRepository(Role);
  }

  private get userRoleRepository() {
    return AppDataSource.getRepository(UserRole);
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(roleData);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findById(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async findByName(name: RoleName): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async update(id: number, roleData: Partial<Role>): Promise<Role | null> {
    await this.roleRepository.update(id, roleData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.roleRepository.delete(id);
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const role = await this.findByName(roleName as RoleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }
    await this.userRoleRepository.save({ userId, roleId: role.id });
  }

  async removeRoleFromUser(userId: string, roleId: number): Promise<void> {
    await this.userRoleRepository.delete({ userId, roleId });
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });
    return userRoles.map((ur) => ur.role);
  }

  async hasRole(userId: string, roleName: RoleName): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some((role) => role.name === roleName);
  }

  async hasAnyRole(userId: string, roleNames: RoleName[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some((role) => roleNames.includes(role.name));
  }
}
