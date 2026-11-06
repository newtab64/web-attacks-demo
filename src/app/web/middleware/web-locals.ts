import type { Request, Response, NextFunction } from 'express';
import { i18n } from '../../../core/i18n/vi.js';

export function createWebLocalsMiddleware(isSecure: boolean, showModeBadge: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.i18n = i18n;
    res.locals.user = req.session?.user || null;

    if (
      !res.locals.user &&
      process.env['NODE_ENV'] !== 'production' &&
      req.query['preview_user'] === 'minhanh'
    ) {
      res.locals.user = {
        id: 2,
        username: 'minhanh',
        email: 'minhanh@tramdev.local',
        role: 'member',
      };
    }

    res.locals.isSecure = isSecure;
    res.locals.showModeBadge = showModeBadge;
    res.locals.csrfToken = req.session?.csrfToken || '';

    if (req.session?.flash) {
      res.locals.flash = req.session.flash;
      delete req.session.flash;
    } else {
      res.locals.flash = null;
    }

    next();
  };
}
