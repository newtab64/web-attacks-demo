import { Router } from 'express';
import { ProfileService } from './service.js';
import { updateEmailSchema } from './schemas.js';
import { i18n } from '../../i18n/vi.js';

export function createProfileRouter(mode: 'vulnerable' | 'secure'): Router {
  const router = Router();
  const profileService = new ProfileService(mode);

  router.get('/profile', (_req, res) => {
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
  });

  router.post('/profile/email', (req, res) => {
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

    const { email } = parsed.data;
    profileService.updateEmail(res.locals.user.id, email);

    if (req.session) {
      if (req.session.user) {
        req.session.user.email = email;
      }
      req.session.flash = { success: i18n.profile.emailUpdated };
    }

    res.redirect('/profile');
  });

  return router;
}
