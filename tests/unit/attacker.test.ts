import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createAttackerApp, clearCapturedStore } from '../../attacker/server.js';

describe('Attacker Server (Port 4000)', () => {
  const app = createAttackerApp();

  beforeEach(() => {
    clearCapturedStore();
  });

  it('serves phishing page with convincing Vietnamese styling', async () => {
    const res = await request(app).get('/phishing.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Campus Devs');
    expect(res.text).toContain('Đăng nhập');
  });

  it('captures submitted credentials and records in /captured', async () => {
    const postRes = await request(app)
      .post('/capture')
      .send('username=victim_user&password=SecretPassword123')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(postRes.status).toBe(302);
    expect(postRes.header.location).toBe('/captured');

    const getCaptured = await request(app).get('/captured');
    expect(getCaptured.status).toBe(200);
    expect(getCaptured.text).toContain('victim_user');
    expect(getCaptured.text).toContain('SecretPassword123');
  });

  it('serves auto-submitting CSRF page targeting localhost:3000/profile/email', async () => {
    const res = await request(app).get('/csrf.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http://localhost:3000/profile/email');
    expect(res.text).toContain('attacker@pwned.com');
    expect(res.text).toContain('.submit()');
  });
});
