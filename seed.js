const bcrypt = require('bcryptjs');
const db = require('./db');

// clear existing tables
db.exec('DELETE FROM comments; DELETE FROM posts; DELETE FROM users;');

// seed users (storing both bcrypt hash and plaintext)
const insertUser = db.prepare(`
  INSERT INTO users (username, password, plaintext_password, email, role)
  VALUES (?, ?, ?, ?, ?)
`);

const users = [
  { username: 'admin', pass: 'admin123', email: 'admin@campusblog.local', role: 'admin' },
  { username: 'alice', pass: 'alice123', email: 'alice@campusblog.local', role: 'user' },
  { username: 'bob', pass: 'bob123', email: 'bob@campusblog.local', role: 'user' }
];

const userIds = {};
for (const u of users) {
  const hash = bcrypt.hashSync(u.pass, 10);
  const info = insertUser.run(u.username, hash, u.pass, u.email, u.role);
  userIds[u.username] = info.lastInsertRowid;
}

// seed posts
const insertPost = db.prepare(`
  INSERT INTO posts (title, content, author_id, created_at)
  VALUES (?, ?, ?, ?)
`);

const posts = [
  {
    title: 'Welcome to Campus Dev Community!',
    content: 'Welcome everyone to our new community blog! This space is dedicated to student developers sharing tutorials, campus tech news, and coding projects.',
    author: 'admin',
    date: '2026-10-25 10:00:00'
  },
  {
    title: 'Getting Started with Node.js and SQLite',
    content: 'SQLite paired with Node.js makes an exceptionally lightweight stack for learning server architecture. No daemon configuration required!',
    author: 'alice',
    date: '2026-10-27 14:30:00'
  },
  {
    title: 'Campus Hackathon 2026 Announced',
    content: 'Registration is now officially open for our annual 48-hour fall hackathon. Bring your ideas, build teams, and showcase your apps next weekend.',
    author: 'admin',
    date: '2026-10-29 09:15:00'
  },
  {
    title: 'Best Coffee Spots for Studying on Campus',
    content: 'A comprehensive review of study cafes near the science and engineering library with great Wi-Fi, comfortable desks, and solid espresso.',
    author: 'bob',
    date: '2026-11-01 16:45:00'
  },
  {
    title: 'Upcoming Open Source Workshop',
    content: 'Join us this Thursday at 6 PM in Hall B for an interactive Git and open-source contribution workshop. All skill levels welcome!',
    author: 'alice',
    date: '2026-11-02 11:20:00'
  }
];

const postIds = [];
for (const p of posts) {
  const info = insertPost.run(p.title, p.content, userIds[p.author], p.date);
  postIds.push(info.lastInsertRowid);
}

// seed comments
const insertComment = db.prepare(`
  INSERT INTO comments (post_id, author_name, content, created_at)
  VALUES (?, ?, ?, ?)
`);

insertComment.run(postIds[0], 'alice', 'Excited for this community! Great initiative.', '2026-10-25 11:00:00');
insertComment.run(postIds[0], 'bob', 'Looking forward to writing about our project here!', '2026-10-25 12:15:00');
insertComment.run(postIds[1], 'admin', 'Solid guide Alice. Clear and easy to follow.', '2026-10-27 15:20:00');

console.log('Database seeded successfully.');
