import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse } from '../../../common/decorators/api-response.decorator';
import { CouponService } from '../services/coupon.service';
import { CreateCouponDto, ApplyCouponDto } from '../dto/coupon.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Coupon } from '../entities/coupon.entity';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';

@ApiTags('coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiSuccessResponse(201, 'Coupon created successfully', Coupon)
  async createCoupon(@Body() createCouponDto: CreateCouponDto): Promise<Coupon> {
    try {
      const coupon = await this.couponService.createCoupon(createCouponDto);
      return coupon;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get(':code')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a coupon by code' })
  @ApiResponse({ status: 200, description: 'Coupon found', type: Coupon })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async getCoupon(@Param('code') code: string): Promise<Coupon> {
    try {
      const coupon = await this.couponService.getCouponByCode(code);
      return coupon;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException('Coupon not found');
      }
      throw error;
    }
  }

  @Post(':code/validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon' })
  @ApiSuccessResponse(200, 'Coupon is valid', Coupon)
  @ApiErrorResponse(404, 'Coupon not found')
  async validateCoupon(
    @Param('code') code: string,
    @Body('cartValue') cartValue: number
  ): Promise<Coupon> {
    try {
      const coupon = await this.couponService.validateCoupon(code, cartValue);
      return coupon;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException('Coupon not found');
      }
      throw error;
    }
  }

  @Post(':code/apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a coupon to an order' })
  @ApiSuccessResponse(200, 'Coupon applied successfully')
  @ApiErrorResponse(400, 'Invalid coupon')
  async applyCouponToOrder(
    @Param('code') code: string,
    @Body() applyCouponDto: ApplyCouponDto
  ): Promise<{ id: string; total: number; discount: number }> {
    try {
      const updatedOrder = await this.couponService.applyCouponToOrder(
        applyCouponDto.order,
        code,
        applyCouponDto.user_id
      );
      return updatedOrder;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
