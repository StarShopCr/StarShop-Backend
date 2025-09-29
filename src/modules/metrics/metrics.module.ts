import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultLabels: {
        app: 'starshop-backend',
      },
    }),
  ],
})
export class MetricsModule {}
