import express, { type Express } from 'express';
import path from 'node:path';
import { env, type Env } from './core/config/env.js';
import { createSecurityHeadersMiddleware } from './core/security/security-headers.js';
import { createSessionMiddleware } from './core/security/session.js';
import { createCsrfMiddleware } from './core/security/csrf.js';
import { createWebLocalsMiddleware } from './app/web/middleware/web-locals.js';
import { webNotFoundHandler, webErrorHandler } from './app/web/middleware/web-error-handler.js';
import { createWebRouter } from './app/web/routes.js';

export function createApp(configOverride?: Partial<Env>): Express {
  const appEnv: Env = { ...env, ...configOverride };
  const isSecure = appEnv.securityMode === 'secure';
  const showModeBadge = appEnv.showModeBadge;

  const app = express();

  // Express view engine setup
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('src/app/web/views'));

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
  app.use(createWebLocalsMiddleware(isSecure, showModeBadge));
  app.use(createCsrfMiddleware(isSecure));

  // Layout rendering wrapper: wraps rendered view content inside src/app/web/views/layouts/base.ejs
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

  // Web routes
  const mode = appEnv.securityMode;
  app.use(createWebRouter(mode));

  // 404 & 500 error handlers
  app.use(webNotFoundHandler);
  app.use(webErrorHandler);

  return app;
}
