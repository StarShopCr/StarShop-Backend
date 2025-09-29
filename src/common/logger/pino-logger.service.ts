import { Injectable, LoggerService } from '@nestjs/common';
import { Logger } from 'pino';

@Injectable()
export class PinoLoggerService implements LoggerService {
  constructor(private readonly logger: Logger) {}

  log(message: any, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: any, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug?(message: any, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose?(message: any, context?: string) {
    this.logger.trace({ context }, message);
  }
}
