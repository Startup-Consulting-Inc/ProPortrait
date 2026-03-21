/**
 * Prerender public routes for SEO.
 *
 * Runs after `vite build`. Starts a local preview server, visits each public
 * route with a real Chromium instance (via Playwright), and saves the fully
 * rendered HTML to dist/<route>/index.html so Firebase Hosting can serve
 * static HTML to Googlebot instead of an empty shell.
 *
 * Usage: tsx scripts/prerender.ts
 * Typically invoked via the `postbuild` npm script.
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

// Public routes to prerender (exclude /create and /admin — auth-protected or dynamic)
const ROUTES = [
  '/',
  '/pricing',
  '/comparison',
  '/blog',
  '/blog/free-ai-headshot-no-subscription',
  '/blog/ai-headshot-vs-photographer',
  '/blog/linkedin-profile-photo-tips-2026',
  '/styles/editorial',
  '/styles/environmental',
  '/styles/candid',
  '/styles/vintage',
  '/styles/black-white',
  '/styles/cyberpunk',
  '/styles/watercolor',
  '/contact',
  '/privacy',
  '/terms',
];

function waitForServer(url: string, timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) resolve();
          else setTimeout(check, 300);
        })
        .on('error', () => {
          if (Date.now() - start > timeout)
            reject(new Error(`Server at ${url} did not start within ${timeout}ms`));
          else setTimeout(check, 300);
        });
    };
    check();
  });
}

async function prerender() {
  console.log('🚀 Starting prerender...');

  const root = path.resolve(__dirname, '..');

  // Start vite preview server in background
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: root,
    stdio: 'pipe',
    detached: false,
  });

  server.stderr?.on('data', (d: Buffer) => {
    const msg = d.toString().trim();
    if (msg) console.log(`  [preview] ${msg}`);
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`✅ Preview server ready at ${BASE_URL}`);

    const browser = await chromium.launch();
    const context = await browser.newContext({
      userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    });

    for (const route of ROUTES) {
      const page = await context.newPage();
      const url = `${BASE_URL}${route}`;
      console.log(`  Rendering ${route}...`);

      // Use 'domcontentloaded' — 'networkidle' hangs forever because Firebase
      // keeps WebSocket connections open indefinitely.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Give React a moment to render after DOM is ready
      await page.waitForTimeout(1500);

      const html = await page.content();

      const outputDir =
        route === '/' ? DIST_DIR : path.join(DIST_DIR, route.slice(1));

      fs.mkdirSync(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, 'index.html');
      fs.writeFileSync(outputPath, html, 'utf8');
      console.log(`  ✅ Saved ${outputPath}`);

      await page.close();
    }

    await browser.close();
    console.log('✅ Prerender complete.');
  } finally {
    server.kill();
  }
}

prerender().catch((err) => {
  console.error('❌ Prerender failed:', err);
  process.exit(1);
});
