import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from '../services/store.service';
import { CreateStoreDto, UpdateStoreDto, StoreResponseDto } from '../dto/store.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../../types/role';
import { AuthenticatedRequest } from '../../../types/auth-request.type';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully',
    type: StoreResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async createStore(
    @Body() createStoreDto: CreateStoreDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: StoreResponseDto }> {
    const store = await this.storeService.createStore(req.user.id, createStoreDto);

    return {
      success: true,
      data: store,
    };
  }

  @Get('my-stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stores for the authenticated seller' })
  @ApiResponse({
    status: 200,
    description: 'Stores retrieved successfully',
    type: [StoreResponseDto],
  })
  async getMyStores(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: StoreResponseDto[] }> {
    const stores = await this.storeService.getSellerStores(req.user.id);

    return {
      success: true,
      data: stores,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific store by ID' })
  @ApiResponse({
    status: 200,
    description: 'Store retrieved successfully',
    type: StoreResponseDto,
  })
  async getStoreById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; data: StoreResponseDto }> {
    const store = await this.storeService.getStoreById(id);

    return {
      success: true,
      data: store,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a store' })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully',
    type: StoreResponseDto,
  })
  async updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoreDto: UpdateStoreDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: StoreResponseDto }> {
    const store = await this.storeService.updateStore(id, req.user.id, updateStoreDto);

    return {
      success: true,
      data: store,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a store' })
  @ApiResponse({
    status: 200,
    description: 'Store deleted successfully',
  })
  @HttpCode(HttpStatus.OK)
  async deleteStore(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    await this.storeService.deleteStore(id, req.user.id);

    return {
      success: true,
      message: 'Store deleted successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all active stores' })
  @ApiResponse({
    status: 200,
    description: 'Stores retrieved successfully',
    type: [StoreResponseDto],
  })
  async getActiveStores(): Promise<{ success: boolean; data: StoreResponseDto[] }> {
    const stores = await this.storeService.getActiveStores();

    return {
      success: true,
      data: stores,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stores' })
  @ApiResponse({
    status: 200,
    description: 'Stores retrieved successfully',
    type: [StoreResponseDto],
  })
  async searchStores(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('location') location?: string,
  ): Promise<{ success: boolean; data: StoreResponseDto[] }> {
    const stores = await this.storeService.searchStores(query, category, location);

    return {
      success: true,
      data: stores,
    };
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store statistics' })
  @ApiResponse({
    status: 200,
    description: 'Store statistics retrieved successfully',
  })
  async getStoreStats(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: any }> {
    const stats = await this.storeService.getStoreStats(id, req.user.id);

    return {
      success: true,
      data: stats,
    };
  }

  // Admin endpoints
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store status (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Store status updated successfully',
    type: StoreResponseDto,
  })
  async updateStoreStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ): Promise<{ success: boolean; data: StoreResponseDto }> {
    const store = await this.storeService.updateStoreStatus(id, status as any);

    return {
      success: true,
      data: store,
    };
  }
}
