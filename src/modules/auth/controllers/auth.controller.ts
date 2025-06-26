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
import { AuthService } from '../services/auth.service';
import { BadRequestError } from '../../../utils/errors';
import { StellarWalletLoginDto, RegisterUserDto, ChallengeDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface ChallengeResponse {
  success: boolean;
  data: { challenge: string; walletAddress: string; timestamp: number };
}

interface AuthResponse {
  success: boolean;
  data: {
    user: { id: number; walletAddress: string; name: string; email: string; role: string };
    expiresIn: number;
  };
}

interface UserResponse {
  success: boolean;
  data: {
    id: number;
    walletAddress: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Generate authentication challenge
   * POST /auth/challenge
   */
  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  async generateChallenge(@Body() challengeDto: ChallengeDto): Promise<ChallengeResponse> {
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
  async loginWithWallet(
    @Body() loginDto: StellarWalletLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponse> {
    const result = await this.authService.loginWithWallet(
      loginDto.walletAddress,
      loginDto.signature,
      loginDto.message
    );

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
  async registerWithWallet(
    @Body() registerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponse> {
    const result = await this.authService.registerWithWallet({
      walletAddress: registerDto.walletAddress,
      signature: registerDto.signature,
      message: registerDto.message,
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
  async getMe(@Req() req: Request): Promise<UserResponse> {
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
  async logout(@Res({ passthrough: true }) res: Response): Promise<LogoutResponse> {
    // Clear the JWT cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { success: true, message: 'Logged out successfully' };
  }
}
