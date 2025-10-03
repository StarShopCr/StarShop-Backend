import { Controller, Post, Get, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse } from '../../common/decorators/api-response.decorator';
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
  @ApiSuccessResponse(200, 'Cache statistics retrieved successfully')
  @ApiErrorResponse(403, 'Forbidden - Admin access required')
  async getStats() {
    return await this.cacheService.getStats();
  }

  @Post('reset')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cache' })
  @ApiSuccessResponse(200, 'Cache cleared successfully')
  @ApiErrorResponse(403, 'Forbidden - Admin access required')
  async resetCache() {
    await this.cacheService.reset();
    return { message: 'Cache cleared successfully' };
  }

  @Delete('entity/:entity')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate cache for specific entity' })
  @ApiSuccessResponse(200, 'Entity cache invalidated successfully')
  @ApiErrorResponse(403, 'Forbidden - Admin access required')
  async invalidateEntity(entity: string) {
    await this.cacheService.invalidateEntity(entity);
    return { message: `Cache invalidated for entity: ${entity}` };
  }

  @Delete('entity/:entity/action/:action')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate cache for specific entity action' })
  @ApiSuccessResponse(200, 'Entity action cache invalidated successfully')
  @ApiErrorResponse(403, 'Forbidden - Admin access required')
  async invalidateAction(entity: string, action: string) {
    await this.cacheService.invalidateAction(entity, action);
    return { message: `Cache invalidated for entity: ${entity}, action: ${action}` };
  }
}
