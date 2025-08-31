// src/config/jwt.ts

import type { CookieOptions } from 'express';

export const JWT_COOKIE_NAME = 'auth_token' as const;

/**
 * Secret used to sign JWTs.
 * Sourced from environment for consistency across modules.
 */
export const jwtSecret: string = process.env.JWT_SECRET ?? '';

/**
 * JWT expiration used by JwtService.signAsync({ expiresIn }).
 * Keep it as a string to support values like "15m", "1h", "7d".
 */
export const jwtExpiresIn: string = process.env.JWT_EXPIRATION_TIME ?? '1h';

/**
 * Convert a JWT-style expires string (e.g., "15m", "1h", "7d")
 * or raw number-like values into milliseconds for cookie maxAge.
 */
function toMilliseconds(input: string): number {
  const trimmed = input.trim().toLowerCase();

  // Explicit "ms" (e.g., "3600000ms")
  const msMatch = trimmed.match(/^(\d+)ms$/);
  if (msMatch) return Number(msMatch[1]);

  // Plain number: interpret as seconds (e.g., "3600")
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;

  // <number><unit> where unit ∈ {s, m, h, d}
  const unitMatch = trimmed.match(/^(\d+)(s|m|h|d)$/);
  if (unitMatch) {
    const [, valueStr, unit] = unitMatch;
    const value = Number(valueStr);
    const unitMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * unitMs[unit];
  }

  // Fallback: 1 hour
  return 60 * 60 * 1000;
}

/**
 * Build secure cookie options for the auth token.
 * @param isProd Whether the app runs in production (controls `secure`).
 */
export function buildCookieOptions(isProd: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: toMilliseconds(jwtExpiresIn),
    path: '/', // keep JWT available to the whole app
  };
}
