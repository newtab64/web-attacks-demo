import type { Request, Response, NextFunction } from 'express';
import { i18n } from '../i18n/vi.js';

interface AttemptRecord {
  count: number;
  lastAttempt: number;
}

const failedAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function recordFailedLogin(ip: string): void {
  const record = failedAttempts.get(ip);
  const now = Date.now();
  if (!record || now - record.lastAttempt > LOCKOUT_MS) {
    failedAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    record.count += 1;
    record.lastAttempt = now;
  }
}

export function resetLoginAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export function isLoginRateLimited(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.lastAttempt > LOCKOUT_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

export function clearAllRateLimits(): void {
  failedAttempts.clear();
}

export function createRateLimitMiddleware(isSecure: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // vulnerable: no rate limiting
    if (!isSecure) {
      next();
      return;
    }

    // secure: check IP rate limit on login attempts
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isLoginRateLimited(clientIp)) {
      res.status(429).render('pages/login', {
        flash: { error: i18n.auth.rateLimitExceeded },
      });
      return;
    }

    next();
  };
}
