import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { seedDatabase } from '../../src/core/db/seed.js';

describe('Application Factory & Routes', () => {
  beforeAll(() => {
    seedDatabase();
  });

  const secureApp = createApp({ securityMode: 'secure' });
  const vulnApp = createApp({ securityMode: 'vulnerable' });

  it('serves home page with posts and tags', async () => {
    const res = await request(secureApp).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Trạm Dev');
    expect(res.text).toContain('Bắt đầu với Node.js và SQLite');
    expect(res.headers['x-security-mode']).toBe('secure');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('serves home page in vulnerable mode without CSP', async () => {
    const res = await request(vulnApp).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['x-security-mode']).toBe('vulnerable');
    expect(res.headers['content-security-policy']).toBeUndefined();
  });

  it('serves post detail page with comments', async () => {
    const res = await request(secureApp).get('/posts/1');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Bắt đầu với Node.js và SQLite');
    expect(res.text).toContain('Bình luận');
  });

  it('serves 404 page for nonexistent post', async () => {
    const res = await request(secureApp).get('/posts/99999');
    expect(res.status).toBe(404);
    expect(res.text).toContain('404');
  });

  it('filters posts by tag safely', async () => {
    const res = await request(secureApp).get('/?tag=nodejs');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Bắt đầu với Node.js và SQLite');

    const emptyRes = await request(secureApp).get('/?tag=non-existent-tag');
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.text).toContain('Chưa có bài viết nào với thẻ này');
  });

  it('handles search queries', async () => {
    const res = await request(secureApp).get('/search?q=Node');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Node.js');
  });
});
