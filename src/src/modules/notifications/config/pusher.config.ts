import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PusherConfig {
  constructor(private configService: ConfigService) {}

  get appId(): string {
    return this.configService.get<string>('PUSHER_APP_ID');
  }

  get key(): string {
    return this.configService.get<string>('PUSHER_KEY');
  }

  get secret(): string {
    return this.configService.get<string>('PUSHER_SECRET');
  }

  get cluster(): string {
    return this.configService.get<string>('PUSHER_CLUSTER');
  }
}
