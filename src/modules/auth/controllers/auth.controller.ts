import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { BadRequestError } from '../../../utils/errors';
import { StellarWalletLoginDto, RegisterUserDto, ChallengeDto } from '../dto/auth.dto';
import {
  ChallengeResponseDto,
  AuthResponseDto,
  UserResponseDto,
  LogoutResponseDto,
} from '../dto/auth-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Generate authentication challenge
   * POST /auth/challenge
   */
  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate authentication challenge',
    description:
      'Generate a challenge message for wallet authentication. The user must sign this message with their Stellar wallet to authenticate.',
  })
  @ApiBody({ type: ChallengeDto })
  @ApiResponse({
    status: 200,
    description: 'Challenge generated successfully',
    type: ChallengeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address format',
  })
  async generateChallenge(@Body() challengeDto: ChallengeDto): Promise<ChallengeResponseDto> {
    const challenge = this.authService.generateChallenge(challengeDto.walletAddress);

    return {
      success: true,
      data: { challenge, walletAddress: challengeDto.walletAddress, timestamp: Date.now() },
    };
  }

  /**
   * Login with Stellar wallet
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with Stellar wallet',
    description:
      'Authenticate user using their Stellar wallet signature. The user must first get a challenge and sign it with their wallet.',
  })
  @ApiBody({ type: StellarWalletLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or wallet address',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  async loginWithWallet(
    @Body() loginDto: StellarWalletLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithWallet(loginDto.walletAddress);

    // Set JWT token in HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expiresIn * 1000, // Convert to milliseconds
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
   * Register new user with Stellar wallet
   * POST /auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user with Stellar wallet',
    description:
      'Register a new user using their Stellar wallet. User must specify their role (buyer or seller).',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature, wallet address, or user already exists',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  async registerWithWallet(
    @Body() registerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const result = await this.authService.registerWithWallet({
      walletAddress: registerDto.walletAddress,
      role: registerDto.role,
      name: registerDto.name,
      email: registerDto.email,
    });

    // Set JWT token in HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expiresIn * 1000, // Convert to milliseconds
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
   * Get current authenticated user
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user information',
    description: 'Get information about the currently authenticated user',
  })
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const user = await this.authService.getUserById(String(userId));

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
   * Logout user
   * DELETE /auth/logout
   */
  @Delete('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logout the currently authenticated user and clear the session cookie',
  })
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  async logout(@Res({ passthrough: true }) res: Response): Promise<LogoutResponseDto> {
    // Clear the JWT cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { success: true, message: 'Logged out successfully' };
  }
}
