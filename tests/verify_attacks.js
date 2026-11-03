const assert = require('assert');
const { spawn, execSync } = require('child_process');
const http = require('http');

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const opts = Object.assign({}, options);
    opts.headers = Object.assign({}, options.headers || {});
    if (postData) {
      opts.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function extractCookie(headers) {
  const sc = headers['set-cookie'];
  if (!sc) return null;
  const cookies = [];
  const list = Array.isArray(sc) ? sc : [sc];
  for (const c of list) {
    const parts = c.split(';');
    cookies.push(parts[0].trim());
  }
  return cookies.join('; ');
}

async function runTests() {
  console.log('=== STARTING COMPLETE VERIFICATION OF ALL 5 ATTACKS ===\n');

  // -------------------------------------------------------------
  // TEST SUITE 1: VULNERABLE MODE
  // -------------------------------------------------------------
  console.log('--- Phase 1: Testing Vulnerable Mode (SECURITY_MODE=vulnerable) ---');
  execSync('node seed.js', { stdio: 'pipe' });

  const vulnEnv = Object.assign({}, process.env, { SECURITY_MODE: 'vulnerable', PORT: '3000' });
  const vulnServer = spawn('node', ['server.js'], { env: vulnEnv });
  await wait(800);

  const db = require('../db');

  try {
    // 1. SQL Injection Login
    console.log('[Test 1.1] SQLi Login: admin bypass with payload "admin\' --"');
    const sqliLoginRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'username=' + encodeURIComponent("admin' --") + '&password=any');

    assert.strictEqual(sqliLoginRes.statusCode, 302, 'Vulnerable login should redirect on SQLi');
    assert.ok(sqliLoginRes.headers['location'] === '/', 'Vulnerable login should redirect to home');
    const vulnSession = extractCookie(sqliLoginRes.headers);
    assert.ok(vulnSession, 'Session cookie must be returned for admin');

    // 1.2 SQL Injection Search
    console.log('[Test 1.2] SQLi Search: bypass search with "\' OR \'1\'=\'1"');
    const sqliSearchRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/search?q=' + encodeURIComponent("' OR '1'='1"),
      method: 'GET'
    });
    assert.ok(sqliSearchRes.body.includes('Found 5 result(s)'), 'SQLi query should return all 5 seeded posts');

    // 2. XSS (Reflected & Stored)
    console.log('[Test 2.1] Reflected XSS in search query');
    const xssPayload = '<script>alert("reflected")</script>';
    const refXssRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/search?q=' + encodeURIComponent(xssPayload),
      method: 'GET'
    });
    assert.ok(refXssRes.body.includes(xssPayload), 'Vulnerable search must reflect raw unescaped script tag');

    console.log('[Test 2.2] Stored XSS in comments');
    const firstPost = db.prepare('SELECT id FROM posts ORDER BY id ASC LIMIT 1').get();
    const targetPostId = firstPost ? firstPost.id : 1;
    const storedXssPayload = '<img src=x onerror=alert("stored")>';
    await request({
      hostname: 'localhost',
      port: 3000,
      path: '/posts/' + targetPostId + '/comments',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'author_name=Attacker&content=' + encodeURIComponent(storedXssPayload));

    const postRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/posts/' + targetPostId,
      method: 'GET'
    });
    assert.ok(postRes.body.includes(storedXssPayload), 'Vulnerable comments must render unescaped stored payload');

    // 3. CSRF (Change email)
    console.log('[Test 3] CSRF: change email from cross-origin localhost:4000 without token');
    // Login as alice first
    const aliceLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'username=alice&password=alice123');
    const aliceCookie = extractCookie(aliceLogin.headers);
    assert.ok(aliceCookie, 'Alice session cookie obtained');

    // Cross-origin form submission simulation
    const csrfRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/profile/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'http://localhost:4000',
        'Referer': 'http://localhost:4000/csrf.html',
        'Cookie': aliceCookie
      }
    }, 'email=attacker@pwned.com');

    assert.strictEqual(csrfRes.statusCode, 200, 'CSRF form should succeed in vulnerable mode');
    const aliceRow = db.prepare('SELECT email FROM users WHERE username = ?').get('alice');
    assert.strictEqual(aliceRow.email, 'attacker@pwned.com', 'Alice email must be updated by CSRF in vulnerable mode');

    // 4. Passwords and Sessions
    console.log('[Test 4] Passwords and Sessions: plaintext in db & no HttpOnly flag');
    const adminUser = db.prepare('SELECT plaintext_password FROM users WHERE username = ?').get('admin');
    assert.strictEqual(adminUser.plaintext_password, 'admin123', 'Plaintext password exists in database');

    const rawCookieHeader = JSON.stringify(sqliLoginRes.headers['set-cookie']);
    assert.ok(!rawCookieHeader.toLowerCase().includes('httponly'), 'Vulnerable session cookie must NOT have HttpOnly');
    assert.ok(!rawCookieHeader.toLowerCase().includes('samesite'), 'Vulnerable session cookie must NOT have explicit SameSite');

    // 5. Security Headers
    console.log('[Test 5] Security Headers: absent in vulnerable mode');
    const homeRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    assert.strictEqual(homeRes.headers['content-security-policy'], undefined);
    assert.strictEqual(homeRes.headers['x-frame-options'], undefined);
    assert.strictEqual(homeRes.headers['x-content-type-options'], undefined);

    console.log('>>> All 5 attacks successfully executed in VULNERABLE mode.\n');
  } finally {
    vulnServer.kill('SIGTERM');
    await wait(500);
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: SECURE MODE
  // -------------------------------------------------------------
  console.log('--- Phase 2: Testing Secure Mode (SECURITY_MODE=secure) ---');
  execSync('node seed.js', { stdio: 'pipe' });

  const secEnv = Object.assign({}, process.env, { SECURITY_MODE: 'secure', PORT: '3000' });
  const secServer = spawn('node', ['server.js'], { env: secEnv });
  await wait(800);

  try {
    // 1. SQL Injection Login Prevented
    console.log('[Test 1.1] SQLi Login: bypass attempt with "admin\' --" blocked');
    const sqliBlock = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'username=' + encodeURIComponent("admin' --") + '&password=any');

    assert.strictEqual(sqliBlock.statusCode, 200, 'Secure mode should re-render login page');
    assert.ok(sqliBlock.body.includes('Invalid username or password'), 'Secure mode rejects SQLi login');
    const sessionCookie = extractCookie(sqliBlock.headers);
    if (sessionCookie) {
      const match = sessionCookie.match(/session=([^;]+)/);
      if (match) {
        const decoded = Buffer.from(match[1], 'base64').toString('utf8');
        assert.ok(!decoded.includes('"userId"'), 'User ID must not be present in session after failed login');
      }
    }

    // 1.2 SQL Injection Search Sanitized
    console.log('[Test 1.2] SQLi Search: parameterization treats "\' OR \'1\'=\'1" literally');
    const sqliSearchBlock = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/search?q=' + encodeURIComponent("' OR '1'='1"),
      method: 'GET'
    });
    assert.ok(sqliSearchBlock.body.includes('Found 0 result(s)'), 'Secure search treats SQL injection as literal text');

    // 2. XSS Escaping & CSP Verification
    console.log('[Test 2.1] Reflected XSS properly escaped in search');
    const xssPayload = '<script>alert("reflected")</script>';
    const refXssSec = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/search?q=' + encodeURIComponent(xssPayload),
      method: 'GET'
    });
    assert.ok(refXssSec.body.includes('&lt;script&gt;alert(&#34;reflected&#34;)&lt;/script&gt;') || refXssSec.body.includes('&lt;script&gt;'), 'Search query must be HTML-escaped');
    assert.ok(!refXssSec.body.includes('<script>alert("reflected")</script>'), 'Raw script tag must NOT exist in output');

    console.log('[Test 2.2] Stored XSS properly escaped in comments');
    const firstPostSec = db.prepare('SELECT id FROM posts ORDER BY id ASC LIMIT 1').get();
    const targetPostIdSec = firstPostSec ? firstPostSec.id : 1;
    const storedXssPayload = '<img src=x onerror=alert("stored")>';
    await request({
      hostname: 'localhost',
      port: 3000,
      path: '/posts/' + targetPostIdSec + '/comments',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'author_name=Attacker&content=' + encodeURIComponent(storedXssPayload));

    const postSec = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/posts/' + targetPostIdSec,
      method: 'GET'
    });
    assert.ok(postSec.body.includes('&lt;img') || postSec.body.includes('&lt;'), 'Stored comment must be HTML-escaped');
    assert.ok(!postSec.body.includes('<img src=x'), 'Raw HTML tag must NOT exist in rendered comment');

    // 3. CSRF Blocked
    console.log('[Test 3] CSRF: unauthorized email update rejected with 403 Forbidden');
    const aliceLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'username=alice&password=alice123');
    const aliceCookie = extractCookie(aliceLogin.headers);
    assert.ok(aliceCookie, 'Alice logged in with bcrypt in secure mode');

    const csrfSec = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/profile/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'http://localhost:4000',
        'Referer': 'http://localhost:4000/csrf.html',
        'Cookie': aliceCookie
      }
    }, 'email=attacker@pwned.com');

    assert.strictEqual(csrfSec.statusCode, 403, 'CSRF form without token must return 403 Forbidden');
    const aliceRow = db.prepare('SELECT email FROM users WHERE username = ?').get('alice');
    assert.strictEqual(aliceRow.email, 'alice@campusblog.local', 'Alice email must remain unmodified');

    // 4. Passwords, Cookies, and Rate Limiting
    console.log('[Test 4] Passwords and Sessions: HttpOnly, SameSite=Lax, and Rate Limiting');
    const rawCookieHeader = JSON.stringify(aliceLogin.headers['set-cookie']).toLowerCase();
    assert.ok(rawCookieHeader.includes('httponly'), 'Secure cookie must include HttpOnly');
    assert.ok(rawCookieHeader.includes('samesite=lax'), 'Secure cookie must include SameSite=Lax');

    // Rate limiting: perform failed attempts
    console.log('[Test 4.2] Rate limiting on failed login attempts');
    for (let i = 0; i < 5; i++) {
      await request({
        hostname: 'localhost',
        port: 3000,
        path: '/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, 'username=admin&password=wrongpassword');
    }
    const rateLimitRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'username=admin&password=wrongpassword');
    assert.strictEqual(rateLimitRes.statusCode, 429, '6th failed attempt must return 429 Too Many Requests');

    // 5. Security Headers
    console.log('[Test 5] Security Headers: CSP, X-Frame-Options, X-Content-Type-Options');
    const homeSec = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    assert.ok(homeSec.headers['content-security-policy'], 'CSP header must be present');
    assert.strictEqual(homeSec.headers['x-frame-options'], 'DENY');
    assert.strictEqual(homeSec.headers['x-content-type-options'], 'nosniff');

    console.log('>>> All 5 defenses successfully verified in SECURE mode.\n');
  } finally {
    secServer.kill('SIGTERM');
  }

  console.log('All 5 attacks verified successfully in both vulnerable and secure modes.');
}

runTests().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
