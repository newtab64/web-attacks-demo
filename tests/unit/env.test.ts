import { describe, it, expect } from 'vitest';
import { parseEnv } from '../../src/core/config/env.js';

describe('Environment Configuration', () => {
  it('defaults to secure mode when SECURITY_MODE is omitted', () => {
    const config = parseEnv({ SESSION_SECRET: 'test-secret-at-least-32-chars-long' });
    expect(config.securityMode).toBe('secure');
    expect(config.isSecure).toBe(true);
    expect(config.port).toBe(3000);
    expect(config.showModeBadge).toBe(false);
  });

  it('parses vulnerable mode when explicitly specified', () => {
    const config = parseEnv({
      SECURITY_MODE: 'vulnerable',
      PORT: '3001',
      SESSION_SECRET: 'test-secret-at-least-32-chars-long',
      SHOW_MODE_BADGE: '1',
    });
    expect(config.securityMode).toBe('vulnerable');
    expect(config.isSecure).toBe(false);
    expect(config.port).toBe(3001);
    expect(config.showModeBadge).toBe(true);
  });

  it('throws validation error when SESSION_SECRET is missing', () => {
    expect(() => parseEnv({})).toThrow();
  });
});
