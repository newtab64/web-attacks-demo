import type { Request, Response } from 'express';
import { ProfileService } from '../../../core/services/profile.service.js';
import { updateEmailSchema } from '../../../core/services/schemas.js';
import { i18n } from '../../../core/i18n/vi.js';

export function createProfileController(mode: 'vulnerable' | 'secure') {
  const profileService = new ProfileService(mode);

  return {
    renderProfile(_req: Request, res: Response): void {
      if (!res.locals.user) {
        res.redirect('/login');
        return;
      }

      const freshUser = profileService.getUserById(res.locals.user.id);
      if (!freshUser) {
        res.redirect('/login');
        return;
      }

      res.render('pages/profile', {
        user: freshUser,
        flash: res.locals.flash,
      });
    },

    handleUpdateEmail(req: Request, res: Response): void {
      if (!res.locals.user) {
        res.redirect('/login');
        return;
      }

      const parsed = updateEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        if (req.session) {
          req.session.flash = { error: 'Địa chỉ email không hợp lệ.' };
        }
        res.redirect('/profile');
        return;
      }

      const success = profileService.updateEmail(res.locals.user.id, parsed.data.email);
      if (success) {
        if (req.session) {
          req.session.flash = { success: i18n.profile.emailUpdated };
          if (req.session.user) {
            req.session.user.email = parsed.data.email;
          }
        }
      }

      res.redirect('/profile');
    },
  };
}
