import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          return req?.cookies?.token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      // Try to get user by walletAddress first (preferred method)
      let user;
      if (payload.walletAddress) {
        user = await this.authService.getUserByWalletAddress(payload.walletAddress);
      } else if (payload.id) {
        // Fallback to id for backward compatibility during migration
        user = await this.authService.getUserById(payload.id);
      } else {
        throw new UnauthorizedException('Invalid token payload');
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id, // Keep UUID for internal use
        walletAddress: user.walletAddress,
        role: user.userRoles?.[0]?.role?.name || 'buyer',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
