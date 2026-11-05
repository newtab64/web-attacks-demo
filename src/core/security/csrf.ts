import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { i18n } from '../i18n/vi.js';

export function ensureCsrfToken(req: Request): string {
  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    return req.session.csrfToken;
  }
  return '';
}

export function createCsrfMiddleware(isSecure: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    ensureCsrfToken(req);

    // vulnerable: skip CSRF validation entirely
    if (!isSecure) {
      next();
      return;
    }

    // secure: validate token on state-changing methods for sensitive actions (profile email update, logout)
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const requiresCsrf = req.path.startsWith('/profile') || req.path === '/logout';
      if (requiresCsrf) {
        const bodyToken = (req.body as Record<string, unknown> | undefined)?._csrf;
        const headerToken = req.headers['x-csrf-token'];
        const sessionToken = req.session?.csrfToken;

        const token =
          typeof bodyToken === 'string'
            ? bodyToken
            : typeof headerToken === 'string'
              ? headerToken
              : null;

        if (!token || !sessionToken || token !== sessionToken) {
          res.status(403).render('pages/error', {
            title: '403 - Lỗi CSRF',
            description: i18n.profile.csrfError,
          });
          return;
        }
      }
    }

    next();
  };
}
