import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { HealthAllowlistGuard } from '../middleware/healthAllowlist.guard';

@Controller('health')
@UseGuards(HealthAllowlistGuard)
export class HealthController {
  private prisma = new PrismaClient();
  private redis = process.env.REDIS_URL ? createClient({ url: process.env.REDIS_URL }) : null;

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  checkLive() {
    return { status: 'up' };
  }

  @Get('ready')
  @HealthCheck()
  async checkReady() {
    const checks = [];

    // Database check
    checks.push(async () => this.db.pingCheck('database', { timeout: 300 }));

    // Redis check (if enabled)
    if (this.redis) {
      checks.push(async () => {
        try {
          await this.redis.connect();
          await this.redis.ping();
          await this.redis.disconnect();
          return { redis: { status: 'up' } };
        } catch (e) {
          throw new Error('Redis unavailable');
        }
      });
    }

    // Optional memory/disk checks
    if (process.env.HEALTH_HEAP_USED_WARN_MB) {
      checks.push(async () => this.memory.checkHeap(
        'memory_heap',
        parseInt(process.env.HEALTH_HEAP_USED_WARN_MB, 10) * 1024 * 1024,
      ));
    }

    if (process.env.HEALTH_DISK_USED_WARN_PERCENT) {
      checks.push(async () => this.disk.checkStorage('disk', {
        path: '/',
        thresholdPercent: parseInt(process.env.HEALTH_DISK_USED_WARN_PERCENT, 10) / 100,
      }));
    }

    return this.health.check(checks);
  }
}
