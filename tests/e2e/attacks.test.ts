import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { seedDatabase } from '../../src/core/db/seed.js';
import { getDb } from '../../src/core/db/client.js';
import { clearAllRateLimits } from '../../src/core/security/rate-limit.js';

describe('End-to-End Web Attacks & Countermeasures Suite', () => {
  beforeEach(() => {
    seedDatabase();
    clearAllRateLimits();
  });

  describe('1. SQL Injection (SQLi)', () => {
    it('Vulnerable mode: allows login bypass via SQLi in username', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const res = await request(vulnApp)
        .post('/login')
        .type('form')
        .send({ username: "admin' --", password: 'anypassword' });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/');
      expect(res.header['set-cookie']).toBeDefined();
    });

    it('Secure mode: blocks login bypass and rejects payload safely', async () => {
      const secApp = createApp({ securityMode: 'secure' });
      const res = await request(secApp)
        .post('/login')
        .type('form')
        .send({ username: "admin' --", password: 'anypassword' });

      expect(res.status).toBe(401);
      expect(res.text).toContain('Tên đăng nhập hoặc mật khẩu không đúng.');
    });

    it('Vulnerable mode: expands search results to all posts with title SQLi', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const res = await request(vulnApp).get("/search?q=' OR '1'='1");

      expect(res.status).toBe(200);
      expect(res.text).toContain('Bắt đầu với Node.js và SQLite');
      expect(res.text).toContain('Điều mình học được khi hoàn thành dự án nhóm đầu tiên');
    });

    it('Secure mode: matches title search query literally and safely', async () => {
      const secApp = createApp({ securityMode: 'secure' });
      const res = await request(secApp).get("/search?q=' OR '1'='1");

      expect(res.status).toBe(200);
      expect(res.text).toContain('0 kết quả cho');
      expect(res.text).not.toContain('Bắt đầu với Node.js và SQLite');
    });
  });

  describe('2. Cross-Site Scripting (XSS)', () => {
    it('Vulnerable mode: reflects unescaped script tag in search', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const payload = '<script>alert("ref-xss")</script>';
      const res = await request(vulnApp).get(`/search?q=${encodeURIComponent(payload)}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain(payload);
    });

    it('Secure mode: HTML-escapes reflected search query and applies CSP', async () => {
      const secApp = createApp({ securityMode: 'secure' });
      const payload = '<script>alert("ref-xss")</script>';
      const res = await request(secApp).get(`/search?q=${encodeURIComponent(payload)}`);

      expect(res.status).toBe(200);
      expect(res.text).not.toContain(payload);
      expect(res.text).toContain('&lt;script&gt;alert(&#34;ref-xss&#34;)&lt;/script&gt;');
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('Vulnerable mode: stores and renders unescaped comment markup', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const payload = '<img src="x" onerror="alert(\'stored\')">';

      await request(vulnApp)
        .post('/posts/1/comments')
        .type('form')
        .send({ author_name: 'Attacker', content: payload });

      const postRes = await request(vulnApp).get('/posts/1');
      expect(postRes.status).toBe(200);
      expect(postRes.text).toContain(payload);
    });

    it('Secure mode: escapes stored comment markup and enforces CSP', async () => {
      const secApp = createApp({ securityMode: 'secure' });
      const payload = '<img src="x" onerror="alert(\'stored\')">';

      await request(secApp)
        .post('/posts/1/comments')
        .type('form')
        .send({ author_name: 'Attacker', content: payload });

      const postRes = await request(secApp).get('/posts/1');
      expect(postRes.status).toBe(200);
      expect(postRes.text).not.toContain(payload);
      expect(postRes.text).toContain(
        '&lt;img src=&#34;x&#34; onerror=&#34;alert(&#39;stored&#39;)&#34;&gt;',
      );
    });
  });

  describe('3. Cross-Site Request Forgery (CSRF)', () => {
    it('Vulnerable mode: allows cross-origin email update without CSRF token', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });

      // Alice logs in
      const loginRes = await request(vulnApp)
        .post('/login')
        .type('form')
        .send({ username: 'alice', password: 'alice123' });

      const cookie = (loginRes.header['set-cookie'] as string[] | undefined) ?? [];
      expect(cookie.length).toBeGreaterThan(0);

      // Attacker executes CSRF submission without CSRF token
      const csrfRes = await request(vulnApp)
        .post('/profile/email')
        .set('Cookie', cookie)
        .type('form')
        .send({ email: 'attacker_pwned@example.com' });

      expect(csrfRes.status).toBe(302);

      // Verify email was altered in the database
      const db = getDb('vulnerable');
      const updatedAlice = db
        .prepare('SELECT email FROM users WHERE username = ?')
        .get('alice') as {
        email: string;
      };
      expect(updatedAlice.email).toBe('attacker_pwned@example.com');
    });

    it('Secure mode: rejects email update without valid CSRF token with 403 Forbidden', async () => {
      const secApp = createApp({ securityMode: 'secure' });

      // Alice logs in
      const loginRes = await request(secApp)
        .post('/login')
        .type('form')
        .send({ username: 'alice', password: 'alice123' });

      const cookie = (loginRes.header['set-cookie'] as string[] | undefined) ?? [];
      expect(cookie.length).toBeGreaterThan(0);

      // Attacker attempts CSRF submission without token
      const csrfRes = await request(secApp)
        .post('/profile/email')
        .set('Cookie', cookie)
        .type('form')
        .send({ email: 'attacker_pwned@example.com' });

      expect(csrfRes.status).toBe(403);
      expect(csrfRes.text).toContain('403 - Lỗi CSRF');

      // Verify email was NOT altered
      const db = getDb('secure');
      const alice = db.prepare('SELECT email FROM users WHERE username = ?').get('alice') as {
        email: string;
      };
      expect(alice.email).toBe('alice@campusblog.local');
    });

    it('Secure mode: allows email update with valid session CSRF token', async () => {
      const secApp = createApp({ securityMode: 'secure' });

      const loginRes = await request(secApp)
        .post('/login')
        .type('form')
        .send({ username: 'alice', password: 'alice123' });

      const cookie = (loginRes.header['set-cookie'] as string[] | undefined) ?? [];
      expect(cookie.length).toBeGreaterThan(0);

      // Get profile page to extract valid CSRF token
      const profilePage = await request(secApp).get('/profile').set('Cookie', cookie);

      const match = profilePage.text.match(/name="_csrf" value="([^"]+)"/);
      expect(match).not.toBeNull();
      const csrfToken = match?.[1] ?? '';

      // Legitimate submit with CSRF token
      const updateRes = await request(secApp)
        .post('/profile/email')
        .set('Cookie', cookie)
        .type('form')
        .send({ email: 'alice_new_email@campusblog.local', _csrf: csrfToken });

      expect(updateRes.status).toBe(302);

      const db = getDb('secure');
      const alice = db.prepare('SELECT email FROM users WHERE username = ?').get('alice') as {
        email: string;
      };
      expect(alice.email).toBe('alice_new_email@campusblog.local');
    });
  });

  describe('4. Broken Authentication & Session Management', () => {
    it('Vulnerable mode: passwords stored as plaintext, cookies lack HttpOnly', async () => {
      const vulnDb = getDb('vulnerable');
      const alice = vulnDb
        .prepare('SELECT password FROM users WHERE username = ?')
        .get('alice') as {
        password: string;
      };
      expect(alice.password).toBe('alice123');

      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const loginRes = await request(vulnApp)
        .post('/login')
        .type('form')
        .send({ username: 'alice', password: 'alice123' });

      const cookieHeader = JSON.stringify(loginRes.header['set-cookie'] || []);
      expect(cookieHeader.toLowerCase()).not.toContain('httponly');
      expect(cookieHeader.toLowerCase()).not.toContain('samesite');
    });

    it('Secure mode: passwords stored as bcrypt hashes, cookies have HttpOnly and SameSite=Lax', async () => {
      const secDb = getDb('secure');
      const alice = secDb.prepare('SELECT password FROM users WHERE username = ?').get('alice') as {
        password: string;
      };
      expect(alice.password.startsWith('$2')).toBe(true);

      const secApp = createApp({ securityMode: 'secure' });
      const loginRes = await request(secApp)
        .post('/login')
        .type('form')
        .send({ username: 'alice', password: 'alice123' });

      const cookieHeader = JSON.stringify(loginRes.header['set-cookie'] || []);
      expect(cookieHeader.toLowerCase()).toContain('httponly');
      expect(cookieHeader.toLowerCase()).toContain('samesite=lax');
    });

    it('Secure mode: limits failed login attempts and triggers HTTP 429 on 6th attempt', async () => {
      const secApp = createApp({ securityMode: 'secure' });

      for (let i = 0; i < 5; i++) {
        const failRes = await request(secApp)
          .post('/login')
          .type('form')
          .send({ username: 'alice', password: 'wrongpassword' });
        expect(failRes.status).toBe(401);
      }

      // 6th attempt should be blocked by rate limiter
      const blockedRes = await request(secApp)
        .post('/login')
        .type('form')
        .send({ username: 'alice', password: 'wrongpassword' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.text).toContain('Quá nhiều lần đăng nhập không thành công.');
    });
  });

  describe('5. Security Headers', () => {
    it('Vulnerable mode: omits defense-in-depth security headers', async () => {
      const vulnApp = createApp({ securityMode: 'vulnerable' });
      const res = await request(vulnApp).get('/');

      expect(res.headers['content-security-policy']).toBeUndefined();
      expect(res.headers['x-frame-options']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBeUndefined();
      expect(res.headers['x-security-mode']).toBe('vulnerable');
    });

    it('Secure mode: emits strict security headers (CSP, X-Frame-Options, nosniff)', async () => {
      const secApp = createApp({ securityMode: 'secure' });
      const res = await request(secApp).get('/');

      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['x-security-mode']).toBe('secure');
    });
  });

  describe('6. Sidebar & Tag Filtering Features', () => {
    it('Tag filter returns only tagged posts', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/?tag=nodejs');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Bắt đầu với Node.js và SQLite');
      expect(res.text).not.toContain('Hiểu về Git Rebase và Git Merge');
      expect(res.text).toContain('class="chip on"');
    });

    it('Unknown tag returns 200 with empty state and does not echo tag query', async () => {
      const app = createApp({ securityMode: 'secure' });
      const res = await request(app).get('/?tag=nonexistent-tag');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Chưa có bài viết nào với thẻ này');
      expect(res.text).not.toContain('nonexistent-tag');
    });

    it('Recent comments links resolve to comment cards with matching IDs', async () => {
      const app = createApp({ securityMode: 'secure' });
      const homeRes = await request(app).get('/');

      expect(homeRes.status).toBe(200);
      const matches = homeRes.text.match(/\/posts\/(\d+)#comment-(\d+)/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBeGreaterThan(0);

      const firstLink = matches?.[0] ?? '';
      const parts = firstLink.match(/\/posts\/(\d+)#comment-(\d+)/);
      const postId = parts?.[1];
      const commentId = parts?.[2];

      const postRes = await request(app).get(`/posts/${postId}`);
      expect(postRes.status).toBe(200);
      expect(postRes.text).toContain(`id="comment-${commentId}"`);
    });
  });
});
