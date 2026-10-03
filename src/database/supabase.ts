import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabaseClient: SupabaseClient | null = null;

export const connectDatabase = async (): Promise<SupabaseClient> => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);

  try {
    const { error } = await supabaseClient.from('_dummy').select('count').limit(1);
    if (error) {
      logger.warn('Supabase connection test failed (expected for dummy table):', error.message);
    }
    logger.info('Supabase client initialized');
  } catch (error) {
    logger.error('Supabase connection error:', error);
    throw error;
  }

  return supabaseClient;
};

export const getSupabase = (): SupabaseClient | null => supabaseClient;
