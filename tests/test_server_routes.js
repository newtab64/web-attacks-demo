const assert = require('assert');
const http = require('http');

process.env.SECURITY_MODE = 'secure';
const { app, server } = require('../server.js');

const req = http.request('http://localhost:3000/', res => {
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.headers['content-security-policy'], 'Secure mode must include CSP header');
  assert.strictEqual(res.headers['x-frame-options'], 'DENY', 'Secure mode must include X-Frame-Options');
  assert.strictEqual(res.headers['x-content-type-options'], 'nosniff', 'Secure mode must include X-Content-Type-Options');
  server.close(() => {
    console.log('Task 3 route tests passed.');
    process.exit(0);
  });
});
req.on('error', err => {
  assert.fail(err);
});
req.end();
