import express, { type Express } from 'express';
import path from 'node:path';
import { env, type Env } from './config/env.js';
import { createSecurityHeadersMiddleware } from './middleware/security-headers.js';
import { createSessionMiddleware } from './middleware/session.js';
import { createLocalsMiddleware } from './middleware/locals.js';
import { createCsrfMiddleware } from './middleware/csrf.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { createAuthRouter } from './modules/auth/routes.js';
import { createPostsRouter } from './modules/posts/routes.js';
import { createCommentsRouter } from './modules/comments/routes.js';
import { createSearchRouter } from './modules/search/routes.js';
import { createProfileRouter } from './modules/profile/routes.js';

export function createApp(configOverride?: Partial<Env>): Express {
  const appEnv: Env = { ...env, ...configOverride };
  const isSecure = appEnv.securityMode === 'secure';
  const showModeBadge = appEnv.showModeBadge;

  const app = express();

  // Express view engine setup
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('src/views'));

  if (isSecure) {
    app.disable('x-powered-by');
  }

  // Security headers & mode tagging
  app.use(createSecurityHeadersMiddleware(isSecure));

  // Parsing & static assets
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.static(path.resolve('public')));

  // Session & context middleware
  app.use(createSessionMiddleware(appEnv.sessionSecret, isSecure));
  app.use(createLocalsMiddleware(isSecure, showModeBadge));
  app.use(createCsrfMiddleware(isSecure));

  // Layout rendering wrapper: wraps rendered view content inside src/views/layouts/base.ejs
  app.use((_req, res, next) => {
    const originalRender = res.render.bind(res);

    res.render = function (
      view: string,
      options?: object,
      callback?: (err: Error, html: string) => void,
    ) {
      const opts = (options ?? {}) as Record<string, unknown>;
      if (opts['layout'] === false || view.startsWith('layouts/')) {
        originalRender(view, opts, callback as (err: Error, html: string) => void);
        return;
      }

      originalRender(view, opts, (err: Error, html: string) => {
        if (err as unknown) {
          if (callback) {
            callback(err, '');
            return;
          }
          next(err);
          return;
        }
        const layoutOpts = {
          ...res.locals,
          ...opts,
          body: html,
        };
        originalRender('layouts/base', layoutOpts, callback as (err: Error, html: string) => void);
      });
    };

    next();
  });

  // Feature routers
  const mode = appEnv.securityMode;
  app.use(createAuthRouter(mode));
  app.use(createPostsRouter(mode));
  app.use(createCommentsRouter(mode));
  app.use(createSearchRouter(mode));
  app.use(createProfileRouter(mode));

  // 404 & 500 error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
