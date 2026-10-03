import pino from 'pino';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
  },
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: 'starshop-backend',
    },
  },
  transport,
);

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      durationMs: duration,
    }, 'HTTP request');
  });
  next();
};
