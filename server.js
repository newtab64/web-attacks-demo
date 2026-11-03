const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// security mode toggle (secure by default)
const secure = process.env.SECURITY_MODE !== 'vulnerable';

// security headers
if (secure) {
  // secure: set defense-in-depth HTTP security headers
  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });
}

// parsing & static files
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// session configuration
app.use(cookieSession({
  name: 'session',
  keys: ['secret_lecture_key'],
  httpOnly: secure,                 // vulnerable: false (script accessible), secure: true
  sameSite: secure ? 'lax' : false  // vulnerable: no samesite attribute, secure: lax
}));

// login rate limiting store for secure mode (max 5 failed attempts per IP / 5 min)
const loginAttempts = new Map();

// csrf token & template context middleware
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(16).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  res.locals.secure = secure;

  if (req.session.userId) {
    res.locals.user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(req.session.userId) || null;
  } else {
    res.locals.user = null;
  }
  next();
});

// authentication guard
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// home page - recent posts
app.get('/', (req, res) => {
  const posts = db.prepare(`
    SELECT posts.*, users.username AS author_name
    FROM posts
    JOIN users ON posts.author_id = users.id
    ORDER BY posts.created_at DESC
  `).all();
  res.render('home', { posts });
});

// view single post with comments
app.get('/posts/:id', (req, res) => {
  const post = db.prepare(`
    SELECT posts.*, users.username AS author_name
    FROM posts
    JOIN users ON posts.author_id = users.id
    WHERE posts.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).send('Post not found');

  const comments = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.render('post', { post, comments });
});

// add comment (stored XSS vector in vulnerable mode)
app.post('/posts/:id/comments', (req, res) => {
  let { author_name, content } = req.body;
  if (!author_name || !content) return res.redirect(`/posts/${req.params.id}`);

  if (secure) {
    // secure: basic input trimming / validation
    author_name = String(author_name).trim().slice(0, 50);
    content = String(content).trim().slice(0, 1000);
  }

  db.prepare('INSERT INTO comments (post_id, author_name, content) VALUES (?, ?, ?)').run(
    req.params.id,
    author_name,
    content
  );
  res.redirect(`/posts/${req.params.id}`);
});

// search posts (SQL injection & reflected XSS vectors)
app.get('/search', (req, res) => {
  const q = req.query.q || '';
  let results = [];

  if (!secure) {
    // vulnerable: string concatenation SQL query
    try {
      const sql = "SELECT * FROM posts WHERE title LIKE '%" + q + "%'";
      results = db.prepare(sql).all();
    } catch (err) {
      results = [];
    }
  } else {
    // secure: parameterized query
    results = db.prepare('SELECT * FROM posts WHERE title LIKE ?').all(`%${q}%`);
  }

  res.render('search', { query: q, results });
});

// login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// login handler (SQL injection & password/session vector)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || '127.0.0.1';

  // rate limiting in secure mode
  if (secure) {
    const attempts = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 300000 };
    if (Date.now() > attempts.resetAt) {
      attempts.count = 0;
      attempts.resetAt = Date.now() + 300000;
    }
    if (attempts.count >= 5) {
      return res.status(429).send('Too many failed login attempts. Please try again in 5 minutes.');
    }
    loginAttempts.set(ip, attempts);
  }

  let user = null;

  if (!secure) {
    // vulnerable: string concatenation SQL query & plaintext password check
    try {
      const sql = "SELECT * FROM users WHERE username = '" + username + "' AND plaintext_password = '" + password + "'";
      user = db.prepare(sql).get();
    } catch (err) {
      return res.render('login', { error: 'Database syntax error: ' + err.message });
    }
  } else {
    // secure: parameterized query & bcrypt password hash verification
    const candidate = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (candidate && bcrypt.compareSync(password, candidate.password)) {
      user = candidate;
    }
  }

  if (user) {
    if (secure) loginAttempts.delete(ip);
    req.session.userId = user.id;
    return res.redirect('/');
  }

  if (secure) {
    const attempts = loginAttempts.get(ip);
    if (attempts) attempts.count += 1;
  }

  res.render('login', { error: 'Invalid username or password' });
});

// register page
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// register handler
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.render('register', { error: 'All fields are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.render('register', { error: 'Username is already taken' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO users (username, password, plaintext_password, email, role)
    VALUES (?, ?, ?, ?, 'user')
  `).run(username, hash, password, email);

  req.session.userId = info.lastInsertRowid;
  res.redirect('/');
});

// logout
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

// profile page
app.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { message: null, error: null });
});

// change email (CSRF vector)
app.post('/profile/email', requireAuth, (req, res) => {
  const { email, _csrf } = req.body;

  if (secure) {
    // secure: require valid CSRF token
    if (!_csrf || _csrf !== req.session.csrfToken) {
      return res.status(403).send('Forbidden: Invalid CSRF token');
    }
  }

  if (!email || !email.includes('@')) {
    return res.render('profile', { message: null, error: 'Valid email required' });
  }

  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, req.session.userId);
  res.render('profile', { message: 'Email address updated successfully!', error: null });
});

const server = app.listen(PORT, () => {
  console.log(`Blog server running on http://localhost:${PORT} [mode: ${secure ? 'secure' : 'vulnerable'}]`);
});

module.exports = { app, server };
