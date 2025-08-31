import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import ipRangeCheck from 'ip-range-check';

@Injectable()
export class HealthAllowlistGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    if (process.env.NODE_ENV === 'production' && process.env.HEALTH_ALLOWLIST) {
      const allowlist = process.env.HEALTH_ALLOWLIST.split(',');
      if (!ipRangeCheck(request.ip, allowlist)) {
        throw new ForbiddenException('Forbidden');
      }
    }
    
    return true;
  }
}
