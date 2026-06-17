import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');
const PORT = 4178;
const ORIGIN = 'https://chillmechanic.com';

if (!fs.existsSync(indexPath)) {
  console.error(`Prerender failed: missing ${indexPath}. Run "vite build" first.`);
  process.exit(1);
}

// --- Collect routes to prerender from the generated sitemap (single source of truth) ---
function getRoutes() {
  const routes = new Set(['/']);
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const xml = fs.readFileSync(sitemapPath, 'utf-8');
    for (const loc of xml.match(/<loc>(.*?)<\/loc>/g) || []) {
      const url = loc.replace(/<\/?loc>/g, '').trim();
      const p = url.replace(ORIGIN, '') || '/';
      if (p.startsWith('/')) routes.add(p.replace(/\/$/, '') || '/');
    }
  } else {
    console.warn('No sitemap.xml found in dist; prerendering home page only.');
  }
  return [...routes];
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

// --- Minimal static server with SPA fallback, so client routing renders each URL ---
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(distDir, urlPath);
      if (
        filePath.startsWith(distDir) &&
        fs.existsSync(filePath) &&
        fs.statSync(filePath).isFile()
      ) {
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function run() {
  const routes = getRoutes();
  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const rendered = [];
  let failures = 0;

  for (const route of routes) {
    const page = await browser.newPage();
    try {
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: 'networkidle0',
        timeout: 45000,
      });
      // Wait for the main heading, then a beat for react-helmet-async to update <head>.
      await page.waitForSelector('h1', { timeout: 15000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 400));

      // Drop static <head> tags from index.html that react-helmet-async has
      // re-emitted (marked data-rh) for this page, so crawlers see exactly one
      // description / og:* / canonical. Static defaults with no Helmet override stay.
      await page.evaluate(() => {
        const keyOf = (el) =>
          el.getAttribute('name') || el.getAttribute('property') || el.getAttribute('rel');
        const groups = {};
        for (const el of document.querySelectorAll(
          'meta[name], meta[property], link[rel="canonical"]'
        )) {
          const k = keyOf(el);
          if (k) (groups[k] ||= []).push(el);
        }
        for (const els of Object.values(groups)) {
          if (els.length > 1 && els.some((e) => e.hasAttribute('data-rh'))) {
            els.filter((e) => !e.hasAttribute('data-rh')).forEach((e) => e.remove());
          }
        }
      });

      rendered.push({ route, html: await page.content() });
      console.log(`  ✓ ${route}`);
    } catch (err) {
      failures++;
      console.warn(`  ✗ ${route} — ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  // Write after capturing everything so the dev server never serves a half-written file mid-run.
  for (const { route, html } of rendered) {
    const outDir = route === '/' ? distDir : path.join(distDir, route);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  }

  console.log(`\nPrerender complete: ${rendered.length} pages written, ${failures} skipped.`);
}

run().catch((err) => {
  // Never fail the deploy: any unrendered route still falls back to CSR via the SPA rewrite.
  console.error('Prerender error (continuing with CSR fallback):', err);
  process.exit(0);
});
