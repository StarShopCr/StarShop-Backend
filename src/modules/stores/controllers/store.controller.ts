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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse } from '../../../common/decorators/api-response.decorator';
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
  @ApiSuccessResponse(201, 'Store created successfully', StoreResponseDto)
  @HttpCode(HttpStatus.CREATED)
  async createStore(
    @Body() createStoreDto: CreateStoreDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: StoreResponseDto }> {
    const sellerId = req.user.id as number;
    const store = await this.storeService.createStore(sellerId, createStoreDto);

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
  @ApiSuccessResponse(200, 'Stores retrieved successfully', StoreResponseDto, true)
  async getMyStores(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: StoreResponseDto[] }> {
    const sellerId = req.user.id as number;
    const stores = await this.storeService.getSellerStores(sellerId);

    return {
      success: true,
      data: stores,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific store by ID' })
  @ApiSuccessResponse(200, 'Store retrieved successfully', StoreResponseDto)
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
  @ApiSuccessResponse(200, 'Store updated successfully', StoreResponseDto)
  async updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoreDto: UpdateStoreDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: StoreResponseDto }> {
    const sellerId = req.user.id as number;
    const store = await this.storeService.updateStore(id, sellerId, updateStoreDto);

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
  @ApiSuccessResponse(200, 'Store deleted successfully')
  @HttpCode(HttpStatus.OK)
  async deleteStore(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    const sellerId = req.user.id as number;
    await this.storeService.deleteStore(id, sellerId);

    return {
      success: true,
      message: 'Store deleted successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all active stores' })
  @ApiSuccessResponse(200, 'Stores retrieved successfully', StoreResponseDto, true)
  async getActiveStores(): Promise<{ success: boolean; data: StoreResponseDto[] }> {
    const stores = await this.storeService.getActiveStores();

    return {
      success: true,
      data: stores,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stores' })
  @ApiSuccessResponse(200, 'Stores retrieved successfully', StoreResponseDto, true)
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
  @ApiSuccessResponse(200, 'Store statistics retrieved successfully')
  async getStoreStats(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: any }> {
    const sellerId = req.user.id as number;
    const stats = await this.storeService.getStoreStats(id, sellerId);

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
  @ApiSuccessResponse(200, 'Store status updated successfully', StoreResponseDto)
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
