import cookieSession from 'cookie-session';
import type { RequestHandler } from 'express';

export function createSessionMiddleware(sessionSecret: string, isSecure: boolean): RequestHandler {
  return cookieSession({
    name: 'session',
    keys: [sessionSecret],
    maxAge: 24 * 60 * 60 * 1000,
    // vulnerable: httpOnly=false allows document.cookie access; secure: httpOnly=true prevents XSS cookie theft
    httpOnly: isSecure,
    // vulnerable: sameSite=false allows cross-site form submissions; secure: sameSite='lax' prevents CSRF
    sameSite: isSecure ? 'lax' : false,
    secure: false, // Local demo runs on HTTP
  });
}
