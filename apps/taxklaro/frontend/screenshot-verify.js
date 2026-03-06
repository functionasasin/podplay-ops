/**
 * Stage 10: Screenshot verification script
 * Serves the built dist/ and takes screenshots of all public routes.
 */

import { chromium } from '@playwright/test';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const PORT = 9988;

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function createServer() {
  return http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
    filePath = filePath.split('?')[0];
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const ROUTES = [
  { path: '/', name: '01-landing' },
  { path: '/auth', name: '02-auth-login' },
  { path: '/auth/reset', name: '03-auth-reset' },
  { path: '/auth/reset-confirm', name: '04-auth-reset-confirm' },
  { path: '/onboarding', name: '05-onboarding' },
  { path: '/computations', name: '06-computations-list' },
  { path: '/computations/new', name: '07-wizard-new' },
  { path: '/clients', name: '08-clients-list' },
  { path: '/clients/new', name: '09-clients-new' },
  { path: '/deadlines', name: '10-deadlines' },
  { path: '/settings', name: '11-settings' },
  { path: '/settings/team', name: '12-settings-team' },
];

const ISSUES = [];

async function main() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log('Static server running on http://localhost:' + PORT);

  const browser = await chromium.launch({ headless: true });

  try {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const desktopPage = await desktop.newPage();
    const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const mobilePage = await mobile.newPage();

    for (const route of ROUTES) {
      const url = 'http://localhost:' + PORT + route.path;
      console.log('\nScreenshotting: ' + route.path);

      await desktopPage.goto(url, { waitUntil: 'networkidle' });
      await desktopPage.waitForTimeout(600);
      await desktopPage.screenshot({ path: path.join(SCREENSHOTS_DIR, route.name + '-desktop.png'), fullPage: true });

      await mobilePage.goto(url, { waitUntil: 'networkidle' });
      await mobilePage.waitForTimeout(600);
      await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, route.name + '-mobile.png'), fullPage: true });

      const headings = await desktopPage.$$eval('h1, h2, [class*="font-display"]', els =>
        els.map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 60),
          font: window.getComputedStyle(el).fontFamily,
        }))
      );

      const bodyFont = await desktopPage.evaluate(() => window.getComputedStyle(document.body).fontFamily);
      const hasDmSans = bodyFont.toLowerCase().includes('dm sans') || bodyFont.toLowerCase().includes('sans');
      const hasSerifHeading = headings.some(h => h.font.toLowerCase().includes('serif'));

      console.log('  Body font: ' + bodyFont.split(',')[0].trim());
      if (headings.length > 0) {
        console.log('  First heading: "' + headings[0].text + '" font: ' + headings[0].font.split(',')[0].trim());
      }

      if (!hasDmSans) {
        ISSUES.push(route.path + ': Body font not DM Sans (got: ' + bodyFont + ')');
        console.log('  WARNING: Body font check failed');
      }
      if (headings.length > 0 && !hasSerifHeading) {
        ISSUES.push(route.path + ': No serif headings (fonts: ' + headings.map(h => h.font.split(',')[0]).join(', ') + ')');
        console.log('  WARNING: No serif headings found');
      }

      const bodyText = await desktopPage.evaluate(() => document.body.innerText.trim());
      if (bodyText.length < 10) {
        ISSUES.push(route.path + ': Page appears empty');
        console.log('  WARNING: Page appears empty');
      } else {
        console.log('  OK: ' + headings.length + ' headings, body length ' + bodyText.length);
      }
    }

    await desktop.close();
    await mobile.close();
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log('Screenshots: ' + SCREENSHOTS_DIR);
  if (ISSUES.length > 0) {
    console.log('\nISSUES (' + ISSUES.length + '):');
    ISSUES.forEach(i => console.log('  - ' + i));
    process.exit(1);
  } else {
    console.log('All checks passed!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
