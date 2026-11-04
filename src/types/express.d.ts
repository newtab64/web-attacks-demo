import type { SessionUser, FlashMessages } from './index.js';

declare global {
  namespace Express {
    interface Request {
      session?: {
        user?: SessionUser;
        csrfToken?: string;
        flash?: FlashMessages;
        [key: string]: unknown;
      } | null;
    }
    interface Locals {
      i18n: typeof import('../i18n/vi.js').i18n;
      user: SessionUser | null;
      isSecure: boolean;
      showModeBadge: boolean;
      csrfToken: string;
      flash: FlashMessages | null;
      activeTag?: string | null;
    }
  }
}

export {};
