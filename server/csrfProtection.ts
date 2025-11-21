import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = '__csrf_token';

export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Generate CSRF token for GET requests
  if (req.method === 'GET') {
    if (!req.session || !(req.session as any).csrfToken) {
      const token = generateCsrfToken();
      if (req.session) {
        (req.session as any).csrfToken = token;
      }
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });
    }
    return next();
  }

  // Validate CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const tokenFromHeader = req.headers[CSRF_HEADER] as string;
    const tokenFromSession = (req.session as any)?.csrfToken;

    if (!tokenFromHeader || !tokenFromSession || tokenFromHeader !== tokenFromSession) {
      return res.status(403).json({ 
        message: 'CSRF token validation failed',
        error: 'Invalid or missing CSRF token'
      });
    }
  }

  next();
}

export function generateCsrfTokenRoute(req: Request, res: Response) {
  const token = generateCsrfToken();
  if (req.session) {
    (req.session as any).csrfToken = token;
  }
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000
  });
  res.json({ token });
}
