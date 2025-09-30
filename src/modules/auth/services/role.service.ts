import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';

type RoleName = 'buyer' | 'seller' | 'admin';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>
  ) {}

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
    await this.userRoleRepository.save({
      userId: parseInt(userId),
      roleId: role.id,
    });
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await this.userRoleRepository.delete({ userId, roleId });
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId: parseInt(userId) },
      relations: ['role'],
    });
    return userRoles.map((ur) => ur.role);
  }

  async hasRole(userId: number, roleName: RoleName): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId.toString());
    return userRoles.some((role) => role.name === roleName);
  }

  async hasAnyRole(userId: number, roleNames: RoleName[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId.toString());
    return userRoles.some((role) => roleNames.includes(role.name));
  }
}
