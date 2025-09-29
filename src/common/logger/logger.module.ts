import { Module, Global } from '@nestjs/common';
import { PinoLoggerService } from './pino-logger.service';
import pino from 'pino';

@Global()
@Module({
  providers: [
    {
      provide: 'PINO_LOGGER',
      useFactory: () => {
        return pino({
          level: process.env.LOG_LEVEL || 'info',
          formatters: {
            level(label) {
              return { level: label };
            },
          },
          timestamp: pino.stdTimeFunctions.isoTime,
        });
      },
    },
    {
      provide: PinoLoggerService,
      useFactory: (logger: pino.Logger) => new PinoLoggerService(logger),
      inject: ['PINO_LOGGER'],
    },
  ],
  exports: [PinoLoggerService],
})
export class LoggerModule {}
