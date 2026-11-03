const assert = require('assert');
const http = require('http');

process.env.SECURITY_MODE = 'secure';
const { app, server } = require('../server.js');

const req = http.request('http://localhost:3000/', res => {
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.headers['content-security-policy'], 'Secure mode must include CSP header');
  assert.ok(res.headers['content-security-policy'].includes("style-src 'self' 'unsafe-inline'"), 'CSP must allow inline presentation styles');
  assert.strictEqual(res.headers['x-frame-options'], 'DENY', 'Secure mode must include X-Frame-Options');
  assert.strictEqual(res.headers['x-content-type-options'], 'nosniff', 'Secure mode must include X-Content-Type-Options');

  // Test missing password in POST /login
  const loginPost = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength('username=admin')
    }
  }, loginRes => {
    assert.strictEqual(loginRes.statusCode, 200, 'Missing password should render 200, not 500');
    server.close(() => {
      console.log('Task 3 route tests passed.');
      process.exit(0);
    });
  });
  loginPost.write('username=admin');
  loginPost.end();
});
req.on('error', err => {
  assert.fail(err);
});
req.end();
