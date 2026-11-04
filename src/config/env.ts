import { z } from 'zod';

const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  SECURITY_MODE: z.enum(['vulnerable', 'secure']).default('secure'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters long'),
  SHOW_MODE_BADGE: z
    .enum(['0', '1', 'true', 'false', ''])
    .optional()
    .default('0')
    .transform((val) => val === '1' || val === 'true'),
});

export interface Env {
  port: number;
  securityMode: 'vulnerable' | 'secure';
  isSecure: boolean;
  sessionSecret: string;
  showModeBadge: boolean;
}

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const parsed = envSchema.parse(raw);
  return {
    port: parsed.PORT,
    securityMode: parsed.SECURITY_MODE,
    isSecure: parsed.SECURITY_MODE === 'secure',
    sessionSecret: parsed.SESSION_SECRET,
    showModeBadge: parsed.SHOW_MODE_BADGE,
  };
}

export const env: Env = parseEnv({
  PORT: process.env['PORT'],
  SECURITY_MODE: process.env['SECURITY_MODE'],
  SESSION_SECRET: process.env['SESSION_SECRET'] ?? 'dev-lecture-secret-key-super-secure-32-chars',
  SHOW_MODE_BADGE: process.env['SHOW_MODE_BADGE'],
});
