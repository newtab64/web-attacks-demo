const assert = require('assert');
const ejs = require('ejs');
const fs = require('fs');

const searchTpl = fs.readFileSync('views/search.ejs', 'utf8');
const vulnerableSearch = ejs.render(searchTpl, {
  user: null,
  query: '<script>alert(1)</script>',
  results: [],
  secure: false
}, { views: ['views'] });
assert.ok(vulnerableSearch.includes('<script>alert(1)</script>'), 'Vulnerable search must render raw unescaped query');

const secureSearch = ejs.render(searchTpl, {
  user: null,
  query: '<script>alert(1)</script>',
  results: [],
  secure: true
}, { views: ['views'] });
assert.ok(secureSearch.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'Secure search must render escaped query');

const postTpl = fs.readFileSync('views/post.ejs', 'utf8');
const vulnerableComment = ejs.render(postTpl, {
  user: null,
  post: { id: 1, title: 'Test Post', content: 'Content', author_name: 'Admin', created_at: '2026-11-03' },
  comments: [{ id: 1, author_name: 'Hacker', content: '<b>bold</b>', created_at: '2026-11-03' }],
  secure: false
}, { views: ['views'] });
assert.ok(vulnerableComment.includes('<b>bold</b>'), 'Vulnerable comment must render raw HTML');

const secureComment = ejs.render(postTpl, {
  user: null,
  post: { id: 1, title: 'Test Post', content: 'Content', author_name: 'Admin', created_at: '2026-11-03' },
  comments: [{ id: 1, author_name: 'Hacker', content: '<b>bold</b>', created_at: '2026-11-03' }],
  secure: true
}, { views: ['views'] });
assert.ok(secureComment.includes('&lt;b&gt;bold&lt;/b&gt;'), 'Secure comment must render escaped HTML');

const profileTpl = fs.readFileSync('views/profile.ejs', 'utf8');
const secureProfile = ejs.render(profileTpl, {
  user: { id: 1, username: 'alice', email: 'alice@campusblog.local' },
  csrfToken: 'tok123',
  secure: true,
  message: null
}, { views: ['views'] });
assert.ok(secureProfile.includes('name="_csrf" value="tok123"'), 'Secure profile must render CSRF token input');

console.log('Task 2 tests passed.');
