import type { Request, Response, NextFunction } from 'express';
import { i18n } from '../i18n/vi.js';

export function createLocalsMiddleware(isSecure: boolean, showModeBadge: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.i18n = i18n;
    res.locals.user = req.session?.user || null;
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
