import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import data from '../data/plate-codes.json';
import { LIMITS } from '../src/lib/copy';

// Build smoke tests. Run after `npm run build` (part of `npm run verify`).
const all = readdirSync('dist', { recursive: true, encoding: 'utf8' });
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const read = (f: string) => readFileSync(join('dist', f), 'utf8');
const codes = data.codes.map((c) => c.code);
const slugs = data.provinces.map((p) => p.slug);
const limitsEsc = LIMITS.replace(/&/g, '&amp;');

describe('page count', () => {
  it('81 code pages + 34 province pages + home + bang-ma + nguon + 404', () => {
    const expected = [...codes.map((c) => `${c}.html`), ...slugs.map((s) => `tinh/${s}.html`), 'index.html', 'bang-ma.html', 'nguon.html', '404.html'];
    expect(expected).toHaveLength(81 + 34 + 4);
    expect([...htmlFiles].sort()).toEqual([...expected].sort());
  });
  it('unknown codes get no page (13, 42, 87)', () => {
    for (const c of ['13', '42', '87']) expect(existsSync(`dist/${c}.html`)).toBe(false);
  });
});

describe('sitemap & robots', () => {
  const xml = read('sitemap.xml');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] as string);
  it('lists every page except 404, with absolute URLs and no duplicates', () => {
    expect(locs).toHaveLength(81 + 34 + 3);
    expect(new Set(locs).size).toBe(locs.length);
    const paths = locs.map((l) => new URL(l).pathname).sort();
    const expected = ['/', '/bang-ma', '/nguon', ...codes.map((c) => `/${c}`), ...slugs.map((s) => `/tinh/${s}`)].sort();
    expect(paths).toEqual(expected);
    expect(xml).not.toContain('/404');
  });
  it('robots.txt points at the sitemap', () => {
    expect(read('robots.txt')).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });
});

describe('every code page', () => {
  it.each(codes)('/%s has the limits line, the source, canonical, OG/Twitter, breadcrumb', (c) => {
    const h = read(`${c}.html`);
    expect(h).toContain(limitsEsc);
    expect(h).toContain('Nguồn: Phụ lục 02 TT 51/2025/TT-BCA');
    expect(h).toMatch(new RegExp(`<link rel="canonical" href="[^"]+/${c}"`));
    expect(h).toContain(`/og/${c}.png`);
    expect(h).toContain('twitter:card');
    expect(h).toContain('BreadcrumbList');
    expect(h).toContain('noindex'); // draft data
    expect(h).toContain('đang đối chiếu bản gốc'); // draft note on the source line
    expect(h).not.toContain('DỮ LIỆU NHÁP'); // the red banner is gone
  });
  it('shows the same card pieces as the home search (badge + meta line)', () => {
    const h = read('83.html');
    expect(h).toContain('Hợp nhất từ: Cần Thơ, Sóc Trăng, Hậu Giang');
    expect(h).toContain('class="meta">Miền Nam');
    expect(h).toContain('<title>Biển số 83 là tỉnh nào? Cần Thơ (trước là Sóc Trăng)</title>');
    expect(read('27.html')).toContain('<title>Biển số 27 là tỉnh nào? Điện Biên</title>');
  });
});

describe('province, bang-ma, nguon, 404', () => {
  it.each(slugs)('/tinh/%s lists its codes, the merger sentence and the limits line', (s) => {
    const p = data.provinces.find((x) => x.slug === s) as (typeof data.provinces)[number];
    const h = read(`tinh/${s}.html`);
    for (const c of p.codes) expect(h).toContain(`href="/${c}"`);
    expect(h).toMatch(/hợp nhất thành|không thuộc diện sắp xếp/);
    expect(h).toContain(limitsEsc);
    expect(h).toContain('BreadcrumbList');
  });
  it('area & population are hidden everywhere', () => {
    for (const f of htmlFiles) expect(read(f), f).not.toMatch(/Diện tích|Dân số|km²/);
  });
  it('/bang-ma has all 81 codes grouped by region and works without JS (all rows present, no hidden)', () => {
    const h = read('bang-ma.html');
    expect(h.match(/data-q="/g)).toHaveLength(81);
    for (const t of ['Miền Bắc', 'Miền Trung &#38; Tây Nguyên', 'Miền Nam', 'Mã đặc biệt']) expect(h.replace('&amp;', '&#38;')).toContain(t);
    expect(h).not.toMatch(/<li[^>]*data-q[^>]*hidden/);
    expect(h).toContain('id="filter-empty"');
  });
  it('/nguon has legal basis with dates, what a plate does/doesn\'t say, FAQ JSON-LD, independence, review date', () => {
    const h = read('nguon.html');
    expect(h).toContain('FAQPage');
    expect(h).toContain('Nghị quyết 202/2025/QH15');
    expect(h).toContain('12/06/2025');
    expect(h).toContain('Không cho biết:');
    expect(h).toContain('trang web độc lập');
    expect(h).toContain('Kiểm tra lần cuối: 08/11/2026');
    expect(h.match(/<details/g)?.length).toBeGreaterThanOrEqual(4);
    expect(h).not.toMatch(/biển cũ không phải đổi/i);
  });
  it('404 is friendly: search form + link to /bang-ma', () => {
    const h = read('404.html');
    expect(h).toContain('id="plate-input"');
    expect(h).toContain('href="/bang-ma"');
  });
});

describe('OG images', () => {
  it('one per code + default, valid PNG, each ≤ 60 KB', () => {
    for (const c of [...codes, 'default']) {
      const f = `dist/og/${c}.png`;
      expect(existsSync(f), f).toBe(true);
      expect(statSync(f).size, f).toBeLessThanOrEqual(60 * 1024);
      expect([...readFileSync(f).subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
    }
  });
});

describe('OG default image', () => {
  it('is exactly brand/og-default.png (1200×630)', () => {
    const b = readFileSync('dist/og/default.png');
    expect(b.equals(readFileSync('brand/og-default.png'))).toBe(true);
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630]);
  });
});

describe('internal links', () => {
  const exists = (path: string) => {
    if (path === '/') return existsSync('dist/index.html');
    const p = path.replace(/^\//, '');
    return /\.[a-z0-9]+$/i.test(p) ? existsSync(join('dist', p)) : existsSync(join('dist', `${p}.html`));
  };
  const hrefs = (text: string) => [...text.matchAll(/(?:href|src|content)="(\/[^"/][^"]*|\/)"/g)].map((m) => (m[1] as string).split(/[?#]/)[0] as string);

  it('no internal href/src in any page points to a missing file', () => {
    const bad: string[] = [];
    for (const f of htmlFiles) for (const h of hrefs(read(f))) if (!exists(h)) bad.push(`${f} → ${h}`);
    expect(bad).toEqual([]);
  });
  it('links the browser builds in JS (result chips, 404, etc.) also resolve', () => {
    const bad: string[] = [];
    for (const f of all.filter((x) => x.endsWith('.js'))) {
      for (const m of read(f).matchAll(/["'`](\/(?:bang-ma|nguon|tinh\/[a-z-]+))["'`]/g)) if (!exists(m[1] as string)) bad.push(`${f} → ${m[1]}`);
    }
    expect(bad).toEqual([]);
    // chips in a result point at /{code}: every code of every province has a page
    for (const p of data.provinces) for (const c of p.codes) expect(exists(`/${c}`), c).toBe(true);
  });
  it('the confusing-codes list and chips link to existing pages', () => {
    for (const c of ['61', '72', '83', '92', '93', '34']) expect(read('index.html')).toContain(`href="/${c}"`);
  });
});
