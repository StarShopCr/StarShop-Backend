import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 intentos
  message:
    'Demasiados intentos de inicio de sesión, por favor intente nuevamente después de 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
});
