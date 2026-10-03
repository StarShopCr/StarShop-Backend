import { Router } from 'express';
import { logger } from '../utils/logger';
import { getSupabase } from '../database/supabase';
import { getWalletService } from '../contracts/wallet';
import { getContractConfig } from '../contracts/config';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/wallet/balance', async (_req, res) => {
  try {
    const walletService = getWalletService();
    if (!walletService) {
      const config = getContractConfig();
      const service = getWalletService();
      if (!service) throw new Error('Wallet service not initialized');
      const balance = await service.getBalance();
      return res.json({ address: service.getAddress(), balance: balance.toString() });
    }
    const balance = await walletService.getBalance();
    res.json({ address: walletService.getAddress(), balance: balance.toString() });
  } catch (error) {
    logger.error('Failed to get wallet balance', error as Error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

router.get('/supabase/test', async (_req, res) => {
  try {
    const client = getSupabase();
    if (!client) {
      return res.status(500).json({ error: 'Supabase not connected' });
    }
    const { data, error } = await client.from('products').select('*').limit(5);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, count: data?.length || 0, data });
  } catch (error) {
    logger.error('Supabase test failed', error as Error);
    res.status(500).json({ error: 'Supabase test failed' });
  }
});

export default router;
