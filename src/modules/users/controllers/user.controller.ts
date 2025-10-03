import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { UnauthorizedError } from '../../../utils/errors';
import { UpdateUserDto, RegisterUserDto } from '../../auth/dto/auth.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../../types/role';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse, ApiAuthResponse } from '../../../common/decorators/api-response.decorator';
import { setToken } from '../../../common/utils/response.utils';

interface UserResponse {
  walletAddress: string;
  name: string;
  email: string;
  role: string;
  location?: string;
  country?: string;
  buyerData?: any;
  sellerData?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthResponse {
  success: boolean;
  data: { user: UserResponse; expiresIn: number };
}

interface UserUpdateResponse {
  success: boolean;
  data: UserResponse;
}

interface UsersListResponse {
  success: boolean;
  data: UserResponse[];
}

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  /**
   * Create new user (register)
   * POST /users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user with wallet' })
  @ApiAuthResponse(HttpStatus.CREATED, 'User registered successfully', Object as any)
  
  async createUser(
    @Body() registerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponse> {
    const result = await this.authService.registerWithWallet({
      walletAddress: registerDto.walletAddress,
      role: registerDto.role,
      name: registerDto.name,
      email: registerDto.email,
      location: registerDto.location,
      country: registerDto.country,
      buyerData: registerDto.buyerData,
      sellerData: registerDto.sellerData,
    });

    // Set JWT token using helper to align with ResponseInterceptor
    setToken(res, result.token, { maxAge: result.expiresIn * 1000 });

    return {
      success: true,
      data: {
        user: {
          walletAddress: result.user.walletAddress,
          name: result.user.name,
          email: result.user.email,
          role: result.user.userRoles?.[0]?.role?.name || 'buyer',
          location: result.user.location,
          country: result.user.country,
          buyerData: result.user.buyerData,
          sellerData: result.user.sellerData,
        },
        expiresIn: result.expiresIn,
      },
    };
  }

  /**
   * Update user information
   * PUT /users/update/:walletAddress
   */
  @Put('update/:walletAddress')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update user information' })
  @ApiSuccessResponse(HttpStatus.OK, 'User updated successfully', Object as any)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'You can only update your own profile')
  async updateUser(
    @Param('walletAddress') walletAddress: string,
    @Body() updateDto: UpdateUserDto,
    @Req() req: Request
  ): Promise<UserUpdateResponse> {
    const currentUserWalletAddress = req.user?.walletAddress;
    const currentUserRole = req.user?.role?.[0];

    // Check if user is updating their own profile or is admin
    if (walletAddress !== currentUserWalletAddress && currentUserRole !== 'admin') {
      throw new UnauthorizedError('You can only update your own profile');
    }

    const updatedUser = await this.userService.updateUser(walletAddress, updateDto);

    return {
      success: true,
      data: {
        walletAddress: updatedUser.walletAddress,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.userRoles?.[0]?.role?.name || 'buyer',
        location: updatedUser.location,
        country: updatedUser.country,
        buyerData: updatedUser.buyerData,
        sellerData: updatedUser.sellerData,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  /**
   * Get user by wallet address (admin only or own profile)
   * GET /users/:walletAddress
   */
  @Get(':walletAddress')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get user by wallet address' })
  @ApiSuccessResponse(HttpStatus.OK, 'User retrieved successfully', Object as any)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Access denied')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, 'User not found')
  async getUserByWalletAddress(
    @Param('walletAddress') walletAddress: string,
    @Req() req: Request
  ): Promise<UserUpdateResponse> {
    const currentUserWalletAddress = req.user?.walletAddress;
    const currentUserRole = req.user?.role?.[0];

    // Check if user is accessing their own profile or is admin
    if (walletAddress !== currentUserWalletAddress && currentUserRole !== 'admin') {
      throw new UnauthorizedError('Access denied');
    }

    const user = await this.userService.getUserByWalletAddress(walletAddress);

    return {
      success: true,
      data: {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: user.userRoles?.[0]?.role?.name || 'buyer',
        location: user.location,
        country: user.country,
        buyerData: user.buyerData,
        sellerData: user.sellerData,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Get all users (admin only)
   * GET /users
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiSuccessResponse(HttpStatus.OK, 'Users retrieved successfully', Object as any, true)
  @ApiErrorResponse(HttpStatus.FORBIDDEN, 'Forbidden - Admin access required')
  async getAllUsers(): Promise<UsersListResponse> {
    const users = await this.userService.getUsers();

    return {
      success: true,
      data: users.map((user) => ({
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: user.userRoles?.[0]?.role?.name || 'buyer',
        location: user.location,
        country: user.country,
        buyerData: user.buyerData,
        sellerData: user.sellerData,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }
}
