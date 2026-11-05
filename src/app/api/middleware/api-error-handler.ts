import type { Request, Response, NextFunction } from 'express';

export function apiNotFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Tài nguyên không tồn tại.' });
}

export function apiErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ApiServerError]', err);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
}
