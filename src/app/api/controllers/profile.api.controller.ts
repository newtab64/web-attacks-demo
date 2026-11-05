import type { Request, Response } from 'express';
import { ProfileService } from '../../../core/services/profile.service.js';
import { updateEmailSchema } from '../../../core/services/schemas.js';
import { i18n } from '../../../core/i18n/vi.js';

export function createProfileApiController(mode: 'vulnerable' | 'secure') {
  const profileService = new ProfileService(mode);

  return {
    getProfile(req: Request, res: Response): void {
      const sessionUser = req.session?.user;
      if (!sessionUser) {
        res.status(401).json({ error: 'Chưa đăng nhập.' });
        return;
      }

      const freshUser = profileService.getUserById(sessionUser.id);
      if (!freshUser) {
        res.status(401).json({ error: 'Chưa đăng nhập.' });
        return;
      }

      res.status(200).json({ data: freshUser });
    },

    updateEmail(req: Request, res: Response): void {
      const sessionUser = req.session?.user;
      if (!sessionUser) {
        res.status(401).json({ error: 'Chưa đăng nhập.' });
        return;
      }

      const parsed = updateEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Địa chỉ email không hợp lệ.' });
        return;
      }

      const { email } = parsed.data;
      const success = profileService.updateEmail(sessionUser.id, email);
      if (success && req.session?.user) {
        req.session.user.email = email;
      }

      res.status(200).json({
        data: {
          email,
          message: i18n.profile.emailUpdated,
        },
      });
    },
  };
}
