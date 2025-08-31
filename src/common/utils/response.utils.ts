import { Response } from 'express';

/**
 * Set JWT token in response and res.locals for interceptor access
 * @param res - Express Response object
 * @param token - JWT token
 * @param options - Additional cookie options
 */
export function setToken(
  res: Response, 
  token: string, 
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  } = {}
): void {
  const {
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict',
    maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days default
  } = options;

  // Set token in cookie
  res.cookie('token', token, {
    httpOnly,
    secure,
    sameSite,
    maxAge,
  });

  // Set token in res.locals for interceptor to include
  res.locals.token = token;
}

/**
 * Clear JWT token from response
 * @param res - Express Response object
 */
export function clearToken(res: Response): void {
  // Clear cookie
  res.clearCookie('token');
  
  // Clear token from res.locals
  delete res.locals.token;
}
