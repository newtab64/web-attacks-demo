import { describe, it, expect } from 'vitest';
import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';
import { i18n } from '../../src/i18n/vi.js';

describe('EJS Views & XSS Branching', () => {
  const viewsDir = path.resolve('src/views');
  const searchPath = path.resolve('src/views/pages/search.ejs');
  const commentPath = path.resolve('src/views/partials/comment.ejs');
  const profilePath = path.resolve('src/views/pages/profile.ejs');
  const errorPath = path.resolve('src/views/pages/error.ejs');

  it('renders unescaped search query in vulnerable mode', () => {
    const searchTpl = fs.readFileSync(searchPath, 'utf8');
    const html = ejs.render(
      searchTpl,
      {
        i18n,
        isSecure: false,
        user: null,
        query: '<script>alert(1)</script>',
        results: [],
        activeTag: null,
      },
      { views: [viewsDir], filename: searchPath },
    );
    expect(html).toContain('<script>alert(1)</script>');
  });

  it('renders escaped search query in secure mode', () => {
    const searchTpl = fs.readFileSync(searchPath, 'utf8');
    const html = ejs.render(
      searchTpl,
      {
        i18n,
        isSecure: true,
        user: null,
        query: '<script>alert(1)</script>',
        results: [],
        activeTag: null,
      },
      { views: [viewsDir], filename: searchPath },
    );
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('renders unescaped comment content in vulnerable mode', () => {
    const commentTpl = fs.readFileSync(commentPath, 'utf8');
    const html = ejs.render(
      commentTpl,
      {
        i18n,
        isSecure: false,
        comment: {
          id: 1,
          author_name: 'Attacker',
          content: '<img src="x" onerror="alert(1)">',
          created_at: '2026-11-05',
          relative_time: 'vừa xong',
        },
      },
      { views: [viewsDir], filename: commentPath },
    );
    expect(html).toContain('<img src="x" onerror="alert(1)">');
  });

  it('renders escaped comment content in secure mode', () => {
    const commentTpl = fs.readFileSync(commentPath, 'utf8');
    const html = ejs.render(
      commentTpl,
      {
        i18n,
        isSecure: true,
        comment: {
          id: 1,
          author_name: 'Attacker',
          content: '<img src="x" onerror="alert(1)">',
          created_at: '2026-11-05',
          relative_time: 'vừa xong',
        },
      },
      { views: [viewsDir], filename: commentPath },
    );
    expect(html).toContain('&lt;img src=&#34;x&#34; onerror=&#34;alert(1)&#34;&gt;');
    expect(html).not.toContain('<img src="x" onerror="alert(1)">');
  });

  it('renders profile page with user details and CSRF token', () => {
    const profileTpl = fs.readFileSync(profilePath, 'utf8');
    const html = ejs.render(
      profileTpl,
      {
        i18n,
        isSecure: true,
        user: { username: 'alice', email: 'alice@campusblog.local', role: 'member' },
        csrfToken: 'test-token-123',
        flash: null,
      },
      { views: [viewsDir], filename: profilePath },
    );
    expect(html).toContain('alice@campusblog.local');
    expect(html).toContain('test-token-123');
    expect(html).toContain('name="_csrf"');
  });

  it('renders error page with title and description', () => {
    const errorTpl = fs.readFileSync(errorPath, 'utf8');
    const html = ejs.render(
      errorTpl,
      {
        i18n,
        isSecure: true,
        user: null,
        title: '404 - Không tìm thấy trang',
        description: 'Trang bạn đang tìm kiếm không tồn tại.',
      },
      { views: [viewsDir], filename: errorPath },
    );
    expect(html).toContain('404 - Không tìm thấy trang');
    expect(html).toContain('Trang bạn đang tìm kiếm không tồn tại.');
  });

  it('contains no inline style attributes across any .ejs file', () => {
    const scanDir = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          scanDir(full);
        } else if (file.endsWith('.ejs')) {
          const content = fs.readFileSync(full, 'utf8');
          expect(content).not.toMatch(/style=["'][^"']*["']/i);
        }
      }
    };

    scanDir(path.resolve('src/views/pages'));
    scanDir(path.resolve('src/views/partials'));
    scanDir(path.resolve('src/views/layouts'));
  });
});
