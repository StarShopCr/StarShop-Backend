import { Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient | null = null;

  async getClient(): Promise<SupabaseClient> {
    if (!this.client) {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error('Supabase credentials are not configured');
      }
      this.client = createClient(url, key);
    }
    return this.client;
  }
}
