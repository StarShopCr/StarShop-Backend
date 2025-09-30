import { Controller, Post, Get, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheService } from '../cache.service';
import { AuthGuard } from '../../modules/shared/guards/auth.guard';
import { RolesGuard } from '../../modules/shared/guards/roles.guard';
import { Roles } from '../../modules/shared/decorators/roles.decorator';

@ApiTags('Cache Management')
@Controller('cache')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getStats(): Promise<Record<string, unknown>> {
    return await this.cacheService.getStats();
  }

  @Post('reset')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async resetCache(): Promise<{ message: string }> {
    await this.cacheService.reset();
    return { message: 'Cache cleared successfully' };
  }

  @Delete('entity/:entity')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate cache for specific entity' })
  @ApiResponse({ status: 200, description: 'Entity cache invalidated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async invalidateEntity(entity: string): Promise<{ message: string }> {
    await this.cacheService.invalidateEntity(entity);
    return { message: `Cache invalidated for entity: ${entity}` };
  }

  @Delete('entity/:entity/action/:action')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate cache for specific entity action' })
  @ApiResponse({ status: 200, description: 'Entity action cache invalidated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async invalidateAction(entity: string, action: string): Promise<{ message: string }> {
    await this.cacheService.invalidateAction(entity, action);
    return { message: `Cache invalidated for entity: ${entity}, action: ${action}` };
  }
}
