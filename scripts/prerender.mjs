// Post-build prerender: renders each public route with a headless browser and
// writes the fully-hydrated HTML into dist/, so crawlers and link-preview bots
// that don't run JS still get real content + per-route <title>/<meta>.
//
//   node scripts/prerender.mjs            (run after `vite build`)
//   PRERENDER_CHROME=/path/to/chrome node scripts/prerender.mjs
//
// Uses puppeteer-core, so a Chrome/Chromium binary must be available: set
// PRERENDER_CHROME, or install Chrome in one of the common locations below.

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const PORT = 4183;

// Routes to prerender — keep in sync with public/sitemap.xml and seo/pageMeta.ts.
const PATHS = [
  '/ar', '/en',
  '/ar/tracking', '/en/tracking',
  '/ar/rates', '/en/rates',
  '/ar/pickup', '/en/pickup',
  '/ar/contact', '/en/contact',
  '/ar/resources', '/en/resources',
  '/ar/about', '/en/about',
];

function findChrome() {
  const candidates = [
    process.env.PRERENDER_CHROME,
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

function stripSeoFallback(html) {
  // Remove the SEO_FALLBACK_START..SEO_FALLBACK_END block so only the
  // rendered per-route tags remain in <head>.
  return html.replace(/<!--\s*SEO_FALLBACK_START[\s\S]*?SEO_FALLBACK_END\s*-->/, '').replace(/\n\s*\n\s*\n/g, '\n\n');
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('[prerender] dist/index.html not found — run `vite build` first.');
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error('[prerender] No Chrome/Chromium found. Set PRERENDER_CHROME=/path/to/chrome.');
    process.exit(1);
  }

  const serve = sirv(DIST, { single: true, dev: true });
  const server = createServer((req, res) => serve(req, res, () => {
    res.statusCode = 404;
    res.end('not found');
  }));
  await new Promise((r) => server.listen(PORT, r));

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  let ok = 0;
  try {
    for (const path of PATHS) {
      const page = await browser.newPage();
      try {
        await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle0', timeout: 30000 });
        // The app shows a loading splash first; wait until the real layout mounts
        // (<nav> only renders once loading === false) and React has hoisted a <title>.
        await page.waitForSelector('nav', { timeout: 20000 });
        await page.waitForFunction(
          () => {
            const titles = [...document.querySelectorAll('head > title')];
            return titles.length >= 1 && titles[titles.length - 1].textContent.trim().length > 0;
          },
          { timeout: 15000 },
        );
        // Small settle for any late meta hoist.
        await new Promise((r) => setTimeout(r, 300));

        // Normalise <head>: keep exactly one <title> holding the effective
        // document.title (React's per-route value), and drop the static
        // index.html fallback <meta>/<link> so nothing is duplicated.
        await page.evaluate(() => {
          const title = document.title;
          document.querySelectorAll('head title').forEach((el) => el.remove());
          document.querySelectorAll('head [data-seo-fallback]').forEach((el) => el.remove());
          const t = document.createElement('title');
          t.textContent = title;
          document.head.appendChild(t);
        });

        const html = stripSeoFallback(await page.content());
        const outDir = join(DIST, path.replace(/^\//, ''));
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, 'index.html'), '<!doctype html>\n' + html.replace(/^<!doctype html>\s*/i, ''), 'utf8');
        console.log(`[prerender] ${path} -> dist${path}/index.html`);
        ok++;
      } catch (err) {
        console.error(`[prerender] FAILED ${path}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`[prerender] done — ${ok}/${PATHS.length} routes.`);
  if (ok === 0) process.exit(1);
}

main();
