import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { Request } from 'express';
import { jwtSecret, JWT_COOKIE_NAME } from '../../../config/jwt';

function cookieExtractor(req: Request): string | null {
  return (req && (req.cookies?.[JWT_COOKIE_NAME] || req.cookies?.token)) || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
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
      const user = await this.authService.getUserById(payload.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.userRoles?.[0]?.role?.name || 'buyer',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
