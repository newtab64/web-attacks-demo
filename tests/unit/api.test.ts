import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { seedDatabase } from '../../src/core/db/seed.js';
import { clearAllRateLimits } from '../../src/core/security/rate-limit.js';

describe('REST JSON API (/api/v1/)', () => {
  beforeEach(() => {
    seedDatabase();
    clearAllRateLimits();
  });

  describe('Authentication & Session Contract', () => {
    it('POST /api/v1/auth/login: authenticates with valid credentials, sets cookie, and returns user data', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.username).toBe('admin');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/v1/auth/login: returns 401 for invalid credentials', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Tên đăng nhập hoặc mật khẩu không đúng.');
    });

    it('POST /api/v1/auth/login: vulnerable mode permits SQL injection authentication bypass', async () => {
      const app = createApp({ securityMode: 'vulnerable' });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: "admin' --", password: 'any' });

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('admin');
    });

    it('POST /api/v1/auth/login: secure mode enforces rate limit on 6th failed attempt', async () => {
      const app = createApp({ securityMode: 'secure' });
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ username: 'admin', password: 'bad' });
        expect(res.status).toBe(401);
      }

      const rateLimitedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'bad' });

      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.body.error).toContain('Quá nhiều lần đăng nhập không thành công');
    });

    it('POST /api/v1/auth/register: registers new user and returns 201 with user data', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).post('/api/v1/auth/register').send({
        username: 'apitester',
        password: 'password123',
        email: 'apitester@example.com',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.username).toBe('apitester');
      expect(res.body.data.email).toBe('apitester@example.com');
    });

    it('GET /api/v1/profile: returns 401 unauthenticated when no session cookie is present', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/profile');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Chưa đăng nhập.');
    });

    it('GET /api/v1/profile: returns authenticated profile when session cookie is provided', async () => {
      const app = createApp({ securityMode: 'secure' });
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'alice', password: 'alice123' });

      const cookie = loginRes.headers['set-cookie'];
      expect(cookie).toBeDefined();

      const profileRes = await request(app)
        .get('/api/v1/profile')
        .set('Cookie', cookie as unknown as string[]);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.username).toBe('alice');
      expect(profileRes.body.data.email).toBe('alice@campusblog.local');
    });
  });

  describe('Posts, Tags, Comments & Search', () => {
    it('GET /api/v1/posts: returns list of posts with tags and comment count', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThanOrEqual(8);
      expect(res.body.data.total).toBeGreaterThanOrEqual(8);
    });

    it('GET /api/v1/posts?tag=nodejs: filters posts by tag', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts?tag=nodejs');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/posts/:id: returns 404 for nonexistent post', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts/999999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Bài viết không tồn tại.');
    });

    it('GET /api/v1/posts/1: returns single post details with comments', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts/1');

      expect(res.status).toBe(200);
      expect(res.body.data.post.id).toBe(1);
      expect(Array.isArray(res.body.data.comments)).toBe(true);
    });

    it('POST /api/v1/posts/:id/comments: returns 400 when content is empty', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app)
        .post('/api/v1/posts/1/comments')
        .send({ author_name: 'Tester', content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('POST /api/v1/posts/:id/comments: creates new comment and returns 201', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app)
        .post('/api/v1/posts/1/comments')
        .send({ author_name: 'Sinh viên', content: 'Bình luận API xuất sắc!' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.content).toBe('Bình luận API xuất sắc!');
    });

    it('GET /api/v1/tags: returns list of tags', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/tags');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('GET /api/v1/comments/recent: returns recent comments with relative time', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/comments/recent');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].post_title).toBeDefined();
    });

    it('GET /api/v1/search?q=...: SQL injection expands in vulnerable mode and matches literally in secure mode', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const vulnRes = await request(vulnApp).get("/api/v1/search?q=' OR '1'='1");
      expect(vulnRes.status).toBe(200);
      expect(vulnRes.body.data.length).toBeGreaterThanOrEqual(8);

      const secApp = createApp({ securityMode: 'secure' });
      const secRes = await request(secApp).get("/api/v1/search?q=' OR '1'='1");
      expect(secRes.status).toBe(200);
      expect(secRes.body.data.length).toBe(0);
    });
  });
});
