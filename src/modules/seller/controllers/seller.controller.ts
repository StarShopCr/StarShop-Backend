import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SellerService } from '../services/seller.service';
import { BuildRegisterDto, BuildRegisterResponseDto } from '../dto/build-register.dto';
import { SubmitRegisterDto, SubmitRegisterResponseDto } from '../dto/submit-register.dto';
import { AuthenticatedRequest } from '../../../types/auth-request.type';

@ApiTags('seller')
@Controller('seller/contract')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post('build-register')
  @Roles('seller')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Build unsigned XDR for seller registration',
    description: 'Creates an unsigned XDR transaction for registering seller on Soroban blockchain',
  })
  @ApiResponse({
    status: 200,
    description: 'Unsigned XDR built successfully',
    type: BuildRegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or user not eligible',
  })
  @ApiResponse({
    status: 409,
    description: 'User already has a payout wallet registered',
  })
  async buildRegister(
    @Body() buildRegisterDto: BuildRegisterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<BuildRegisterResponseDto> {
    const result = await this.sellerService.buildRegister(Number(req.user.id), buildRegisterDto);

    return {
      success: true,
      data: result,
    };
  }

  @Post('submit')
  @Roles('seller')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit signed XDR for seller registration',
    description: 'Submits signed XDR to Soroban network and updates user registration status',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration completed successfully',
    type: SubmitRegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signed XDR or user not eligible',
  })
  async submitRegister(
    @Body() submitRegisterDto: SubmitRegisterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SubmitRegisterResponseDto> {
    const result = await this.sellerService.submitRegister(Number(req.user.id), submitRegisterDto);

    return {
      success: true,
      data: result,
    };
  }

  @Get('status')
  @Roles('seller')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get seller registration status',
    description: 'Returns the current registration status of the seller',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration status retrieved successfully',
  })
  async getRegistrationStatus(@Request() req: AuthenticatedRequest) {
    const result = await this.sellerService.getRegistrationStatus(Number(req.user.id));

    return {
      success: true,
      data: result,
    };
  }
}
