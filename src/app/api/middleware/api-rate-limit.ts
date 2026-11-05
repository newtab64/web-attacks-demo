import type { Request, Response, NextFunction } from 'express';
import { isLoginRateLimited } from '../../../core/security/rate-limit.js';
import { i18n } from '../../../core/i18n/vi.js';

export function createApiRateLimitMiddleware(isSecure: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isSecure) {
      next();
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isLoginRateLimited(clientIp)) {
      res.status(429).json({
        error: i18n.auth.rateLimitExceeded,
      });
      return;
    }

    next();
  };
}
