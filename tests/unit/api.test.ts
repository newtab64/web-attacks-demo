import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { seedDatabase } from '../../src/core/db/seed.js';
import { clearAllRateLimits } from '../../src/core/security/rate-limit.js';
import type {
  SessionUser,
  PostRow,
  TagRow,
  CommentRow,
  RecentCommentRow,
} from '../../src/core/types/index.js';

interface JsonResponse<T = unknown> {
  data?: T;
  error?: string;
}

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
        .send({ username: 'quantri', password: 'quantri123' });

      const body = res.body as JsonResponse<SessionUser>;
      expect(res.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(body.data?.username).toBe('quantri');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/v1/auth/login: returns 401 for invalid credentials', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'quantri', password: 'wrongpassword' });

      const body = res.body as JsonResponse;
      expect(res.status).toBe(401);
      expect(body.error).toBe('Tên đăng nhập hoặc mật khẩu không đúng.');
    });

    it('POST /api/v1/auth/login: vulnerable mode permits SQL injection authentication bypass', async () => {
      const app = createApp({ securityMode: 'vulnerable' });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: "quantri' --", password: 'any' });

      const body = res.body as JsonResponse<SessionUser>;
      expect(res.status).toBe(200);
      expect(body.data?.username).toBe('quantri');
    });

    it('POST /api/v1/auth/login: secure mode enforces rate limit on 6th failed attempt', async () => {
      const app = createApp({ securityMode: 'secure' });
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ username: 'quantri', password: 'bad' });
        expect(res.status).toBe(401);
      }

      const rateLimitedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'quantri', password: 'bad' });

      const body = rateLimitedRes.body as JsonResponse;
      expect(rateLimitedRes.status).toBe(429);
      expect(body.error).toContain('Quá nhiều lần đăng nhập không thành công');
    });

    it('POST /api/v1/auth/register: registers new user and returns 201 with user data', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).post('/api/v1/auth/register').send({
        username: 'apitester',
        password: 'password123',
        email: 'apitester@example.com',
      });

      const body = res.body as JsonResponse<SessionUser>;
      expect(res.status).toBe(201);
      expect(body.data?.username).toBe('apitester');
      expect(body.data?.email).toBe('apitester@example.com');
    });

    it('GET /api/v1/profile: returns 401 unauthenticated when no session cookie is present', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/profile');

      const body = res.body as JsonResponse;
      expect(res.status).toBe(401);
      expect(body.error).toBe('Chưa đăng nhập.');
    });

    it('GET /api/v1/profile: returns authenticated profile when session cookie is provided', async () => {
      const app = createApp({ securityMode: 'secure' });
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'minhanh', password: 'minhanh123' });

      const cookie = loginRes.headers['set-cookie'];
      expect(cookie).toBeDefined();

      const profileRes = await request(app)
        .get('/api/v1/profile')
        .set('Cookie', cookie as unknown as string[]);

      const body = profileRes.body as JsonResponse<SessionUser>;
      expect(profileRes.status).toBe(200);
      expect(body.data?.username).toBe('minhanh');
      expect(body.data?.email).toBe('minhanh@tramdev.local');
    });
  });

  describe('Posts, Tags, Comments & Search', () => {
    it('GET /api/v1/posts: returns list of posts with tags and comment count', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts');

      const body = res.body as JsonResponse<{ posts: PostRow[]; total: number }>;
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data?.posts)).toBe(true);
      expect(body.data?.posts.length ?? 0).toBeGreaterThanOrEqual(8);
      expect(body.data?.total ?? 0).toBeGreaterThanOrEqual(8);
    });

    it('GET /api/v1/posts?tag=nodejs: filters posts by tag', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts?tag=nodejs');

      const body = res.body as JsonResponse<{ posts: PostRow[] }>;
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data?.posts)).toBe(true);
      expect(body.data?.posts.length ?? 0).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/posts/:id: returns 404 for nonexistent post', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts/999999');

      const body = res.body as JsonResponse;
      expect(res.status).toBe(404);
      expect(body.error).toBe('Bài viết không tồn tại.');
    });

    it('GET /api/v1/posts/1: returns single post details with comments', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/posts/1');

      const body = res.body as JsonResponse<{ post: PostRow; comments: CommentRow[] }>;
      expect(res.status).toBe(200);
      expect(body.data?.post.id).toBe(1);
      expect(Array.isArray(body.data?.comments)).toBe(true);
    });

    it('POST /api/v1/posts/:id/comments: returns 400 when content is empty', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app)
        .post('/api/v1/posts/1/comments')
        .send({ author_name: 'Tester', content: '' });

      const body = res.body as JsonResponse;
      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it('POST /api/v1/posts/:id/comments: creates new comment and returns 201', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app)
        .post('/api/v1/posts/1/comments')
        .send({ author_name: 'Sinh viên', content: 'Bình luận API xuất sắc!' });

      const body = res.body as JsonResponse<CommentRow>;
      expect(res.status).toBe(201);
      expect(body.data?.id).toBeDefined();
      expect(body.data?.content).toBe('Bình luận API xuất sắc!');
    });

    it('GET /api/v1/tags: returns list of tags', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/tags');

      const body = res.body as JsonResponse<TagRow[]>;
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data?.length ?? 0).toBeGreaterThanOrEqual(5);
    });

    it('GET /api/v1/comments/recent: returns recent comments with relative time', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/api/v1/comments/recent');

      const body = res.body as JsonResponse<RecentCommentRow[]>;
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data?.length ?? 0).toBeGreaterThan(0);
      expect(body.data?.[0]?.post_title).toBeDefined();
    });

    it('GET /api/v1/search?q=...: SQL injection expands in vulnerable mode and matches literally in secure mode', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const vulnRes = await request(vulnApp).get("/api/v1/search?q=' OR '1'='1");
      const vulnBody = vulnRes.body as JsonResponse<PostRow[]>;
      expect(vulnRes.status).toBe(200);
      expect(vulnBody.data?.length ?? 0).toBeGreaterThanOrEqual(8);

      const secApp = createApp({ securityMode: 'secure' });
      const secRes = await request(secApp).get("/api/v1/search?q=' OR '1'='1");
      const secBody = secRes.body as JsonResponse<PostRow[]>;
      expect(secRes.status).toBe(200);
      expect(secBody.data?.length).toBe(0);
    });
  });
});
