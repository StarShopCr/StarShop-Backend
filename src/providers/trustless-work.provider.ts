import { DynamicModule, Global, Module } from '@nestjs/common';
import { EscrowClient } from '@trustless-work/escrow';

@Global()
@Module({})
export class TrustlessWorkProviderModule {
  static forRoot(): DynamicModule {
    const apiKey = process.env.NEXT_PUBLIC_TW_API_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_TW_API_KEY is not set in environment variables');
    }
    const baseURL = process.env.TW_BASE_URL || 'https://api-dev.trustless.work';
    const escrowProvider = {
      provide: 'TRUSTLESS_WORK_ESCROW_CLIENT',
      useFactory: () => new EscrowClient({ apiKey, baseURL }),
    };
    return {
      module: TrustlessWorkProviderModule,
      providers: [escrowProvider],
      exports: [escrowProvider],
    };
  }
}
