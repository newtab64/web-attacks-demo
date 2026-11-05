import type { Request, Response } from 'express';
import { AuthService } from '../../../core/services/auth.service.js';
import { loginSchema, registerSchema } from '../../../core/services/schemas.js';
import { recordFailedLogin, resetLoginAttempts } from '../../../core/security/rate-limit.js';
import { i18n } from '../../../core/i18n/vi.js';

export function createAuthApiController(mode: 'vulnerable' | 'secure') {
  const authService = new AuthService(mode);
  const isSecure = mode === 'secure';

  return {
    login(req: Request, res: Response): void {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const parsed = loginSchema.safeParse(req.body);

      if (!parsed.success) {
        if (isSecure) recordFailedLogin(clientIp);
        res.status(401).json({ error: i18n.auth.loginFailed });
        return;
      }

      const { username, password } = parsed.data;
      const user = authService.login(username, password);

      if (!user) {
        if (isSecure) recordFailedLogin(clientIp);
        res.status(401).json({ error: i18n.auth.loginFailed });
        return;
      }

      if (isSecure) resetLoginAttempts(clientIp);
      if (req.session) {
        req.session.user = user;
      }
      res.status(200).json({ data: user });
    },

    register(req: Request, res: Response): void {
      const parsed = registerSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({ error: i18n.auth.allFieldsRequired });
        return;
      }

      const { username, password, email } = parsed.data;
      const existing = authService.getUserByUsername(username);
      if (existing) {
        res.status(400).json({ error: i18n.auth.usernameTaken });
        return;
      }

      const newUser = authService.register(username, password, email);
      if (req.session) {
        req.session.user = newUser;
      }
      res.status(201).json({ data: newUser });
    },

    logout(req: Request, res: Response): void {
      if (req.session) {
        delete req.session.user;
      }
      res.status(200).json({ data: { message: i18n.nav.logout } });
    },
  };
}
