const assert = require('assert');
const fs = require('fs');

if (fs.existsSync('blog.db')) fs.unlinkSync('blog.db');

require('../seed.js');
const db = require('../db.js');

const users = db.prepare('SELECT username, password, plaintext_password, role FROM users').all();
assert.strictEqual(users.length, 3, 'Expected 3 seeded users');
const admin = users.find(u => u.username === 'admin');
assert.strictEqual(admin.plaintext_password, 'admin123');
assert.ok(admin.password.startsWith('$2'), 'Expected bcrypt hash for admin password');

const posts = db.prepare('SELECT * FROM posts').all();
assert.strictEqual(posts.length, 5, 'Expected 5 seeded posts');

const comments = db.prepare('SELECT * FROM comments').all();
assert.ok(comments.length >= 2, 'Expected at least 2 seeded comments');

console.log('Task 1 tests passed.');
