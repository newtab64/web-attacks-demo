import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function createSecurityHeadersMiddleware(isSecure: boolean) {
  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    xFrameOptions: { action: 'deny' },
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });

  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Security-Mode', isSecure ? 'secure' : 'vulnerable');

    if (isSecure) {
      helmetMiddleware(req, res, next);
    } else {
      next();
    }
  };
}
