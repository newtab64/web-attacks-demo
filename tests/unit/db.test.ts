import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../../src/core/db/client.js';
import { seedDatabase } from '../../src/core/db/seed.js';

describe('Dual Database Client & Seed', () => {
  beforeAll(() => {
    seedDatabase();
  });

  it('seeds data/vulnerable.db with plaintext passwords', () => {
    const db = getDb('vulnerable');
    const quantri = db
      .prepare('SELECT username, password FROM users WHERE username = ?')
      .get('quantri') as { username: string; password: string };
    expect(quantri.password).toBe('quantri123');

    const posts = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    expect(posts.count).toBeGreaterThanOrEqual(8);

    const tags = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
    expect(tags.count).toBeGreaterThanOrEqual(5);
  });

  it('seeds data/secure.db with bcrypt password hashes', () => {
    const db = getDb('secure');
    const quantri = db
      .prepare('SELECT username, password FROM users WHERE username = ?')
      .get('quantri') as { username: string; password: string };
    expect(quantri.password.startsWith('$2')).toBe(true);

    const posts = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    expect(posts.count).toBeGreaterThanOrEqual(8);
  });
});
