const assert = require('assert');
const http = require('http');

const { server } = require('../attacker/server.js');

http.get('http://localhost:4000/phishing.html', res => {
  assert.strictEqual(res.statusCode, 200);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    assert.ok(body.includes('Campus Dev Community'), 'Phishing page must replicate blog branding');

    http.get('http://localhost:4000/csrf.html', res2 => {
      assert.strictEqual(res2.statusCode, 200);
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        assert.ok(body2.includes('http://localhost:3000/profile/email'), 'CSRF page must submit to blog email endpoint');
        assert.ok(body2.includes('submit()'), 'CSRF page must auto-submit form');
        server.close(() => {
          console.log('Task 4 attacker tests passed.');
          process.exit(0);
        });
      });
    });
  });
});
