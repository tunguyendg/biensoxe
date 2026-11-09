import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const all = readdirSync('dist', { recursive: true, encoding: 'utf8' });
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const read = (f: string) => readFileSync(join('dist', f), 'utf8');
const token = process.env.PUBLIC_CF_ANALYTICS_TOKEN?.trim();

describe('fonts: self-hosted, subset, swap, only 700 preloaded', () => {
  const woff2 = all.filter((f) => f.endsWith('.woff2'));
  const css = all.filter((f) => f.endsWith('.css')).map(read).join('\n');

  it('ships 6 woff2 files (vietnamese + latin × 400/600/700), all small', () => {
    expect(woff2).toHaveLength(6);
    for (const f of woff2) expect(statSync(join('dist', f)).size, f).toBeLessThan(30 * 1024);
  });
  it('@font-face uses font-display: swap and local files only (no Google Fonts / CDN)', () => {
    expect(css.match(/@font-face/g)).toHaveLength(6);
    expect(css.match(/font-display:\s*swap/g)).toHaveLength(6);
    for (const f of htmlFiles) expect(read(f), f).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic|https?:\/\//);
  });
  it('every page preloads exactly the two 700 files, with crossorigin, and they exist', () => {
    for (const f of htmlFiles) {
      const links = [...read(f).matchAll(/<link rel="preload"[^>]*as="font"[^>]*>/g)].map((m) => m[0]);
      expect(links, f).toHaveLength(2);
      for (const l of links) {
        expect(l).toContain('crossorigin');
        const href = /href="([^"]+)"/.exec(l)?.[1] as string;
        expect(href).toMatch(/-700-normal\.[\w-]+\.woff2$|700-normal.*\.woff2$/);
        expect(existsSync(join('dist', href))).toBe(true);
      }
    }
  });
});

describe('icons & manifest', () => {
  const files = ['favicon.svg', 'favicon.ico', 'favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'site.webmanifest'];
  it('files exist, match brand/ exactly, and every page links them', () => {
    // Small favicons come from brand/favicon-v2/, large icons (apple-touch, 192/512, maskable) from brand/.
    const v2 = ['favicon.svg', 'favicon.ico', 'favicon-16.png', 'favicon-32.png'];
    for (const f of files.filter((x) => x !== 'site.webmanifest')) {
      expect(existsSync(`dist/${f}`), f).toBe(true);
      const src = v2.includes(f) ? `brand/favicon-v2/${f}` : `brand/${f}`;
      expect(readFileSync(`dist/${f}`).equals(readFileSync(src)), `${f} differs from ${src}`).toBe(true);
    }
    expect(existsSync('dist/favicon-48.png')).toBe(true);
    expect(readFileSync('dist/favicon-48.png').equals(readFileSync('brand/favicon-v2/favicon-48.png'))).toBe(true);
    for (const f of htmlFiles) {
      const h = read(f);
      expect(h.indexOf('favicon.svg?v=2'), f).toBeLessThan(h.indexOf('favicon-32.png?v=2'));
      expect(h.indexOf('favicon-32.png?v=2'), f).toBeLessThan(h.indexOf('favicon-16.png?v=2'));
      expect(h.indexOf('favicon-16.png?v=2'), f).toBeLessThan(h.indexOf('favicon.ico?v=2'));
      for (const k of ['rel="icon" href="/favicon.svg?v=2"', 'href="/favicon-32.png?v=2"', 'href="/favicon-16.png?v=2"', 'rel="icon" href="/favicon.ico?v=2"', 'rel="apple-touch-icon" href="/apple-touch-icon.png"', 'rel="manifest" href="/site.webmanifest"', 'content="#1D4ED8" media="(prefers-color-scheme: light)"', 'content="#0B1F4D" media="(prefers-color-scheme: dark)"']) {
        expect(h, `${f} ${k}`).toContain(k);
      }
    }
  });
  it('PNG sizes are right and the manifest is valid', () => {
    const dim = (f: string) => {
      const b = readFileSync(`dist/${f}`);
      return [b.readUInt32BE(16), b.readUInt32BE(20)];
    };
    expect(dim('favicon-16.png')).toEqual([16, 16]);
    expect(dim('favicon-32.png')).toEqual([32, 32]);
    expect(dim('apple-touch-icon.png')).toEqual([180, 180]);
    expect(dim('icon-192.png')).toEqual([192, 192]);
    expect(dim('icon-512.png')).toEqual([512, 512]);
    expect(dim('icon-maskable-512.png')).toEqual([512, 512]);
    const m = JSON.parse(read('site.webmanifest')) as {
      name: string; short_name: string; lang: string; theme_color: string; background_color: string;
      icons: { src: string; sizes: string; type: string; purpose: string }[];
    };
    expect(m.name).toBe('Biển Số – Tra cứu mã biển số xe');
    expect(m.short_name).toBe('Biển Số');
    expect(m.lang).toBe('vi');
    expect(m.theme_color).toBe('#1D4ED8');
    expect(m.background_color).toBe('#F8FAFC');
    expect(m.icons.map((i) => [i.src, i.sizes, i.purpose])).toEqual([
      ['/icon-192.png', '192x192', 'any'],
      ['/icon-512.png', '512x512', 'any'],
      ['/icon-maskable-512.png', '512x512', 'maskable'],
    ]);
    for (const i of m.icons) expect(existsSync(`dist${i.src}`), i.src).toBe(true);
  });
  it('header: one link to / with aria-label, decorative icon, text name + slogan; no logo-horizontal reference', () => {
    for (const f of htmlFiles) {
      const h = read(f);
      const head = /<header class="site-head">[\s\S]*?<\/header>/.exec(h)?.[0] ?? '';
      expect(head, f).toContain('<a class="brand" href="/" aria-label="Biển Số – Tra cứu mã biển số xe">');
      expect(head, f).toContain('src="/brand/logo-mark.svg" alt="" width="40" height="40"');
      expect(head, f).toContain('>Biển Số</span>');
      expect(head, f).toContain('>Tra cứu mã biển số xe</span>');
      expect(head.match(/<a /g), f).toHaveLength(1);
      expect(h, f).not.toContain('logo-horizontal');
    }
    expect(existsSync('dist/brand/logo-mark.svg')).toBe(true);
    expect(readFileSync('dist/brand/logo-mark.svg').equals(readFileSync('brand/logo-mark.svg'))).toBe(true);
    // Only the copied files are served from brand/: no Facebook cover, no sources.
    expect(existsSync('dist/facebook-cover.png')).toBe(false);
    expect(existsSync('dist/brand/facebook-cover.png')).toBe(false);
  });
});

describe('_headers', () => {
  // Parse into { path → header lines } so the tests do not depend on exact spacing.
  const blocks = new Map<string, string[]>();
  let cur = '';
  for (const line of read('_headers').split('\n')) {
    if (line.trim() === '' || line.startsWith('#')) continue;
    if (!/^\s/.test(line)) blocks.set((cur = line.trim()), []);
    else blocks.get(cur)?.push(line.trim());
  }
  it('has the basic security headers for every path', () => {
    const all = blocks.get('/*') ?? [];
    expect(all).toContain('X-Content-Type-Options: nosniff');
    expect(all).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(all).toContain('Permissions-Policy: camera=(), microphone=(), geolocation=()');
  });
  it('long cache for /_astro/* and /og/*, short revalidating cache for HTML', () => {
    expect(blocks.get('/*')).toContain('Cache-Control: public, max-age=0, must-revalidate');
    expect(blocks.get('/_astro/*')).toEqual(['! Cache-Control', 'Cache-Control: public, max-age=31536000, immutable']);
    const og = blocks.get('/og/*') ?? [];
    expect(og[0]).toBe('! Cache-Control'); // detach the HTML default first
    expect(Number(/max-age=(\d+)/.exec(og[1] ?? '')?.[1])).toBeGreaterThanOrEqual(86400 * 7);
  });
});

describe('Cloudflare Web Analytics is opt-in via PUBLIC_CF_ANALYTICS_TOKEN', () => {
  it.runIf(!token)('no token → no analytics script on any page', () => {
    for (const f of htmlFiles) expect(read(f), f).not.toMatch(/cloudflareinsights|data-cf-beacon/);
  });
  it.runIf(!!token)('token → beacon on every page, token only in data-cf-beacon', () => {
    for (const f of htmlFiles) expect(read(f), f).toContain('static.cloudflareinsights.com/beacon.min.js');
  });
  it('the only third-party origin any page may contact is Cloudflare Insights', () => {
    for (const f of htmlFiles) {
      for (const m of read(f).matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)) expect(m[1], f).toMatch(/^https:\/\/static\.cloudflareinsights\.com\//);
    }
  });
});

describe('dark mode', () => {
  it('the built CSS follows the system colour scheme', () => {
    const css = all.filter((f) => f.endsWith('.css')).map(read).join('\n');
    expect(css).toContain('prefers-color-scheme:dark');
    expect(css).toContain('color-scheme:light dark');
  });
});
