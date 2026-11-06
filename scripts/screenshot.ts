import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createApp } from '../src/app.js';
import { createAttackerApp } from '../attacker/server.js';
import { seedDatabase } from '../src/core/db/seed.js';
import { addCaptured } from '../attacker/capture.js';

const execFileAsync = promisify(execFile);

interface ScreenshotTarget {
  name: string;
  url: string;
  width: number;
  height: number;
  darkMode?: boolean;
}

const screenshotsDir = path.resolve('docs/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

console.log('[Screenshot] Seeding database...');
seedDatabase();

// Preload a captured credential for the dashboard screenshot
addCaptured({
  username: 'minhanh',
  password: 'alicePassword123!',
  ip: '127.0.0.1',
});

console.log('[Screenshot] Starting servers...');
const mainApp = createApp({ securityMode: 'secure' });
const mainServer = mainApp.listen(3000);

const attackerApp = createAttackerApp();
const attackerServer = attackerApp.listen(4000);

const targets: ScreenshotTarget[] = [
  {
    name: '01-home-light.png',
    url: 'http://localhost:3000/',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '02-home-dark.png',
    url: 'http://localhost:3000/',
    width: 1280,
    height: 900,
    darkMode: true,
  },
  {
    name: '03-home-tag-filter.png',
    url: 'http://localhost:3000/?tag=nodejs',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '04-post-detail.png',
    url: 'http://localhost:3000/posts/1',
    width: 1280,
    height: 1100,
    darkMode: false,
  },
  {
    name: '05-search-results.png',
    url: 'http://localhost:3000/search?q=Node',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '06-search-empty.png',
    url: 'http://localhost:3000/search?q=khongtontai',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '07-login.png',
    url: 'http://localhost:3000/login',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '08-register.png',
    url: 'http://localhost:3000/register',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '09-profile.png',
    url: 'http://localhost:3000/profile?preview_user=minhanh',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '10-error-404.png',
    url: 'http://localhost:3000/non-existent-page-url',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '11-attacker-phishing.png',
    url: 'http://localhost:4000/phishing.html',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '12-attacker-csrf.png',
    url: 'http://localhost:4000/csrf.html',
    width: 1280,
    height: 900,
    darkMode: false,
  },
  {
    name: '13-attacker-captured.png',
    url: 'http://localhost:4000/captured',
    width: 1280,
    height: 900,
    darkMode: false,
  },
];

const chromiumPath = '/usr/bin/chromium';

async function run(): Promise<void> {
  try {
    for (const target of targets) {
      const dest = path.join(screenshotsDir, target.name);
      console.log(`[Screenshot] Capturing ${target.name} (${target.url})...`);

      const args = [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        `--window-size=${target.width},${target.height}`,
        `--screenshot=${dest}`,
      ];

      if (target.darkMode) {
        args.push('--force-dark-mode');
      }

      args.push(target.url);

      await execFileAsync(chromiumPath, args);
      console.log(`[Screenshot] Saved ${target.name} (${fs.statSync(dest).size} bytes)`);
    }
  } catch (err) {
    console.error('[Screenshot] Error taking screenshots:', err);
  } finally {
    mainServer.close();
    attackerServer.close();
    console.log('[Screenshot] All done, servers shut down.');
  }
}

void run();
