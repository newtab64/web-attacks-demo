import type { Request, Response, NextFunction } from 'express';
import { i18n } from '../../../core/i18n/vi.js';

export function webNotFoundHandler(_req: Request, res: Response): void {
  res.status(404).render('pages/error', {
    title: i18n.emptyState.notFoundTitle,
    description: i18n.emptyState.notFoundDesc,
  });
}

export function webErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[WebServerError]', err);
  if (res.headersSent) {
    return;
  }
  res.status(500).render('pages/error', {
    title: i18n.emptyState.serverErrorTitle,
    description: i18n.emptyState.serverErrorDesc,
  });
}
