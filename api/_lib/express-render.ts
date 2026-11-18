import type { Browser } from 'puppeteer-core';
import { SITE_SECTIONS } from './express-claude.js';

export type SiteShot = { section: typeof SITE_SECTIONS[number]; buffer: Buffer; width: number; height: number };

const MAX_BYTES = 900 * 1024;
const ALLOWED_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

async function launch(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  }
  return puppeteer.launch({ executablePath: process.env.ATLAS_CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
}

const tile = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="240"><text x="20" y="150" transform="rotate(-24 210 120)" font-family="Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="#111" fill-opacity=".16" stroke="#fff" stroke-opacity=".25" stroke-width=".6">PRÉVIA · ATLAS DIGITAL</text></svg>`);
const watermark = `<style id="atlas-preview-lock">
*,*::before,*::after{animation:none!important;transition:none!important}
#atlas-preview-mark{position:absolute;left:0;top:0;width:100%;z-index:2147483647;pointer-events:none;background:url("data:image/svg+xml,${tile}") repeat}
</style>`;
const markHtml = '<div id="atlas-preview-mark" aria-hidden="true"></div>';

/**
 * Renders the generated HTML in an isolated browser and captures one image per section.
 * Only our own asset origin and Google Fonts may be fetched, so generated markup cannot reach other hosts.
 */
export async function renderSiteShots(html: string, device: 'mobile' | 'desktop', assetOrigin: string): Promise<SiteShot[]> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const mobile = device === 'mobile';
    await page.setViewport({ width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 3 : 1.5, isMobile: mobile, hasTouch: mobile });
    await page.setJavaScriptEnabled(false);
    const assetUrls = new Set([...html.matchAll(/https:\/\/[^\s"'<>]+/g)].map(match => match[0].replaceAll('&amp;', '&')).filter(value => {
      try { const url = new URL(value); return url.origin === assetOrigin && url.pathname === '/api/site-express' && url.searchParams.get('view') === 'asset'; } catch { return false; }
    }));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.startsWith('data:') || url === 'about:blank') return void request.continue();
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.port && (ALLOWED_HOSTS.has(parsed.hostname) || assetUrls.has(parsed.href)) && ['GET', 'HEAD'].includes(request.method())) return void request.continue();
      } catch {}
      void request.abort();
    });
    const locked = html.replace(/<\/head>/i, watermark + '</head>').replace(/<\/body>/i, markHtml + '</body>');
    await page.setContent(locked, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => undefined);
    await Promise.race([page.evaluate(() => document.fonts.ready.then(() => undefined)), new Promise(resolve => setTimeout(resolve, 5000))]);
    // The mark covers the whole document, so every section image carries it.
    await page.evaluate(() => {
      const mark = document.getElementById('atlas-preview-mark');
      if (mark) mark.style.height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) + 'px';
    });
    const maxHeight = mobile ? 1700 : 1300;
    const shots: SiteShot[] = [];
    for (const section of SITE_SECTIONS) {
      const box = await page.evaluate((id: string) => {
        const element = document.getElementById(id);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top + window.scrollY, height: rect.height };
      }, section);
      if (!box) throw new Error('Missing section ' + section);
      // The first image starts at the top so the header and menu are part of it.
      const top = section === 'inicio' ? 0 : Math.max(0, box.top);
      const height = Math.max(400, Math.min(maxHeight, section === 'inicio' ? box.top + box.height : box.height));
      const width = mobile ? 390 : 1440;
      let quality = 74, buffer: Buffer;
      do {
        buffer = Buffer.from(await page.screenshot({ type: 'jpeg', quality, clip: { x: 0, y: top, width, height }, captureBeyondViewport: true }));
        quality -= 12;
      } while (buffer.length > MAX_BYTES && quality > 30);
      if (buffer.length > MAX_BYTES) throw new Error('Screenshot too large');
      const scale = mobile ? 3 : 1.5;
      shots.push({ section, buffer, width: Math.round(width * scale), height: Math.round(height * scale) });
    }
    return shots;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

