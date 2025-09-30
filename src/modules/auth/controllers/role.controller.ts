import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('roles')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Post('assign')
  @UseGuards(JwtAuthGuard)
  async assignRole(
    @Body() body: { userId: number; roleName: number }
  ): Promise<{ success: boolean }> {
    const { userId, roleName } = body;
    await this.roleService.assignRoleToUser(userId.toString(), roleName.toString());
    return { success: true };
  }

  @Get('my-roles')
  @UseGuards(JwtAuthGuard)
  async getMyRoles(@Req() req): Promise<{ roles: string[] }> {
    const roles = await this.roleService.getUserRoles(req.user.id);
    return { roles: roles.map((role) => role.name) };
  }
}
