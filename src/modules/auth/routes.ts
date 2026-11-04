import { Router } from 'express';
import { AuthService } from './service.js';
import { loginSchema, registerSchema } from './schemas.js';
import {
  recordFailedLogin,
  resetLoginAttempts,
  createRateLimitMiddleware,
} from '../../middleware/rate-limit.js';
import { i18n } from '../../i18n/vi.js';

export function createAuthRouter(mode: 'vulnerable' | 'secure'): Router {
  const router = Router();
  const authService = new AuthService(mode);
  const isSecure = mode === 'secure';

  router.get('/login', (_req, res) => {
    if (res.locals.user) {
      res.redirect('/');
      return;
    }
    res.render('pages/login', { flash: res.locals.flash });
  });

  router.post('/login', createRateLimitMiddleware(isSecure), (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      if (isSecure) recordFailedLogin(clientIp);
      res.status(401).render('pages/login', {
        flash: { error: i18n.auth.loginFailed },
      });
      return;
    }

    const { username, password } = parsed.data;
    const user = authService.login(username, password);

    if (!user) {
      if (isSecure) recordFailedLogin(clientIp);
      res.status(401).render('pages/login', {
        flash: { error: i18n.auth.loginFailed },
      });
      return;
    }

    if (isSecure) resetLoginAttempts(clientIp);
    if (req.session) {
      req.session.user = user;
    }
    res.redirect('/');
  });

  router.get('/register', (_req, res) => {
    if (res.locals.user) {
      res.redirect('/');
      return;
    }
    res.render('pages/register', { flash: res.locals.flash });
  });

  router.post('/register', (req, res) => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).render('pages/register', {
        flash: { error: i18n.auth.allFieldsRequired },
      });
      return;
    }

    const { username, password, email } = parsed.data;
    const existing = authService.getUserByUsername(username);
    if (existing) {
      res.status(400).render('pages/register', {
        flash: { error: i18n.auth.usernameTaken },
      });
      return;
    }

    const newUser = authService.register(username, password, email);
    if (req.session) {
      req.session.user = newUser;
    }
    res.redirect('/');
  });

  router.post('/logout', (req, res) => {
    if (req.session) {
      req.session = null;
    }
    res.redirect('/');
  });

  return router;
}
