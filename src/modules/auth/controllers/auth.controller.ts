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
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse, ApiAuthResponse } from '../../../common/decorators/api-response.decorator';
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
import { setToken, clearToken } from '../../../common/utils/response.utils';

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
  @ApiSuccessResponse(200, 'Challenge generated successfully', ChallengeResponseDto)
  @ApiErrorResponse(400, 'Invalid wallet address format')
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
  @ApiAuthResponse(200, 'Login successful', AuthResponseDto)
  @ApiErrorResponse(400, 'Invalid signature or wallet address')
  @ApiErrorResponse(401, 'Authentication failed')
  async loginWithWallet(
    @Body() loginDto: StellarWalletLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithWallet(loginDto.walletAddress);

    // Set JWT token using the helper function
    setToken(res, result.token, {
      maxAge: result.expiresIn * 1000, // Convert to milliseconds
    });

    // Return standardized data; ResponseInterceptor will include token
    return {
      success: true,
      data: {
        user: {
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
  @ApiAuthResponse(201, 'User registered successfully', AuthResponseDto)
  @ApiErrorResponse(400, 'Invalid signature, wallet address, or user already exists')
  @ApiErrorResponse(409, 'User already exists')
  async registerWithWallet(
    @Body() registerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const result = await this.authService.registerWithWallet({
      walletAddress: registerDto.walletAddress,
      role: registerDto.role,
      name: registerDto.name,
      email: registerDto.email,
      country: registerDto.country?.toUpperCase(),
    });

    // Set JWT token using the helper function
    setToken(res, result.token, {
      maxAge: result.expiresIn * 1000, // Convert to milliseconds
    });

    // Return standardized data; ResponseInterceptor will include token
    return {
      success: true,
      data: {
        user: {
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
  @ApiSuccessResponse(200, 'User information retrieved successfully', UserResponseDto)
  @ApiErrorResponse(401, 'User not authenticated')
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const user = await this.authService.getUserById(String(userId));

    return {
      success: true,
      data: {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: user.userRoles?.[0]?.role?.name || 'buyer',
        country: user?.country || null,
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
  @ApiSuccessResponse(200, 'Logout successful', LogoutResponseDto)
  @ApiErrorResponse(401, 'User not authenticated')
  async logout(@Res({ passthrough: true }) res: Response): Promise<LogoutResponseDto> {
    // Clear the JWT token using the helper function
    clearToken(res);

    return { success: true, message: 'Logged out successfully' };
  }
}
