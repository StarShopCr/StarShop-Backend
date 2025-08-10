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
  ParseIntPipe,
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

interface UserResponse {
  id: number;
  walletAddress: string;
  name: string;
  email: string;
  role: string;
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
  
  async createUser(
    @Body() registerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponse> {
    const result = await this.authService.registerWithWallet({
      walletAddress: registerDto.walletAddress,
      role: registerDto.role,
      name: registerDto.name,
      email: registerDto.email,
      country: registerDto.country,
    });

    // Set JWT token in HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expiresIn * 1000,
    });

    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          walletAddress: result.user.walletAddress,
          name: result.user.name,
          email: result.user.email,
          role: result.user.userRoles?.[0]?.role?.name || 'buyer',
        },
        expiresIn: result.expiresIn,
      },
    };
  }

  /**
   * Update user information
   * PUT /users/update/:id
   */
  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateUserDto,
    @Req() req: Request
  ): Promise<UserUpdateResponse> {
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role?.[0];

    // Check if user is updating their own profile or is admin
    if (userId !== currentUserId && currentUserRole !== 'admin') {
      throw new UnauthorizedError('You can only update your own profile');
    }

    const updatedUser = await this.authService.updateUser(userId, updateDto);

    return {
      success: true,
      data: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.userRoles?.[0]?.role?.name || 'buyer',
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  /**
   * Get user by ID (admin only or own profile)
   * GET /users/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserById(
    @Param('id', ParseIntPipe) userId: number,
    @Req() req: Request
  ): Promise<UserUpdateResponse> {
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role?.[0];

    // Check if user is accessing their own profile or is admin
    if (userId !== currentUserId && currentUserRole !== 'admin') {
      throw new UnauthorizedError('Access denied');
    }

    const user = await this.userService.getUserById(String(userId));

    return {
      success: true,
      data: {
        id: user.id,
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: user.userRoles?.[0]?.role?.name || 'buyer',
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
  async getAllUsers(): Promise<UsersListResponse> {
    const users = await this.userService.getUsers();

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: user.userRoles?.[0]?.role?.name || 'buyer',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }
}
