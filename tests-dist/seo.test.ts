import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import data from '../data/plate-codes.json';

// SEO audit over every built page (122). Runs after `npm run build`.
const all = readdirSync('dist', { recursive: true, encoding: 'utf8' });
const files = all.filter((f) => f.endsWith('.html'));
const read = (f: string) => readFileSync(join('dist', f), 'utf8');
const pages = files.map((f) => ({ f, h: read(f) }));
const NOT_INDEXED = new Set(['404.html']);
const indexed = pages.filter((p) => !NOT_INDEXED.has(p.f));

const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&#38;|&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;|&#34;/g, '"').replace(/\s+/g, ' ').trim();
const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
const un = (s: string) => s.replace(/&#38;|&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;|&#34;/g, '"');
const meta = (h: string, key: string) => {
  for (const m of h.matchAll(/<meta\s[^>]*>/g)) if (attr(m[0], 'name') === key || attr(m[0], 'property') === key) return un(attr(m[0], 'content') ?? '');
  return undefined;
};
const headings = (h: string) => [...h.matchAll(/<h([1-6])[\s>][\s\S]*?<\/h\1>/g)].map((m) => ({ level: Number(m[1]), text: strip(m[0]) }));
const title = (h: string) => strip(/<title>([\s\S]*?)<\/title>/.exec(h)?.[1] ?? '');
const ldBlocks = (h: string) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse((m[1] as string).replace(/\\u003c/g, '<')) as Record<string, unknown>);

const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] as string);
const SITE = new URL(locs[0] as string).origin;
const pathOf = (url: string) => new URL(url).pathname;
const fileOf = (path: string) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

describe('1. headings', () => {
  it.each(pages.map((p) => [p.f, p.h] as const))('%s: exactly one <h1>, no skipped levels, no empty headings', (_f, h) => {
    const hs = headings(h);
    expect(hs.filter((x) => x.level === 1)).toHaveLength(1);
    expect(hs[0]?.level).toBe(1);
    for (let i = 1; i < hs.length; i++) expect((hs[i] as { level: number }).level, `${hs[i]?.text} after ${hs[i - 1]?.text}`).toBeLessThanOrEqual((hs[i - 1] as { level: number }).level + 1);
    for (const x of hs) expect(x.text.length).toBeGreaterThan(2);
  });
  it('h1 carries the page keyword', () => {
    const h1 = (f: string) => headings(read(f)).find((x) => x.level === 1)?.text;
    expect(h1('83.html')).toBe('Biển số 83 là tỉnh nào?');
    expect(h1('80.html')).toBe('Biển số 80 là mã gì?');
    expect(h1('tinh/can-tho.html')).toBe('Biển số xe Cần Thơ');
    expect(h1('bang-ma.html')).toBe('Bảng biển số xe 34 tỉnh thành');
    expect(h1('nguon.html')).toContain('biển số xe');
    expect(h1('index.html')).toContain('Biển số xe');
    for (const c of data.codes) if (c.type === 'province') expect(h1(`${c.code}.html`)).toBe(`Biển số ${c.code} là tỉnh nào?`);
    for (const p of data.provinces) expect(h1(`tinh/${p.slug}.html`)).toBe(`Biển số xe ${p.name}`);
  });
});

describe('2. title & meta description', () => {
  it('title ≤ 60 chars, description 120–160 chars, Vietnamese, unique across all pages', () => {
    const bad: string[] = [];
    for (const { f, h } of pages) {
      const t = title(h);
      const d = meta(h, 'description') ?? '';
      if (t.length === 0 || t.length > 60) bad.push(`${f} title ${t.length}: ${t}`);
      if (d.length < 120 || d.length > 160) bad.push(`${f} description ${d.length}: ${d}`);
      if (!/[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i.test(`${t} ${d}`)) bad.push(`${f} no diacritics`);
    }
    expect(bad).toEqual([]);
    expect(new Set(pages.map((p) => title(p.h))).size).toBe(pages.length);
    expect(new Set(pages.map((p) => meta(p.h, 'description'))).size).toBe(pages.length);
  });
  it('code pages carry the code, the current province and the former one (when different)', () => {
    for (const c of data.codes) {
      if (c.type !== 'province') continue;
      const prov = data.provinces.find((p) => p.slug === c.currentProvince) as (typeof data.provinces)[number];
      const h = read(`${c.code}.html`);
      const d = meta(h, 'description') as string;
      expect(d, c.code).toContain(`Biển số ${c.code}`);
      expect(d, c.code).toContain(prov.name);
      if (c.formerProvince !== prov.name) expect(d, c.code).toContain(c.formerProvince);
      expect(title(h), c.code).toContain(`${c.code}`);
    }
  });
});

describe('3. internal links', () => {
  const links = (h: string) => [...h.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: attr(m[0], 'href') ?? '', label: attr(m[0], 'aria-label') ?? strip(m[1] as string), tag: m[0] }));
  const internal = (h: string) => links(h).filter((l) => l.href.startsWith('/') && !l.href.startsWith('//'));
  const hrefsOf = (f: string) => new Set(internal(read(f)).map((l) => l.href));

  it('every code page links to its province page and to the other codes of that province', () => {
    for (const c of data.codes) {
      if (c.type !== 'province') continue;
      const prov = data.provinces.find((p) => p.slug === c.currentProvince) as (typeof data.provinces)[number];
      const hs = hrefsOf(`${c.code}.html`);
      expect(hs.has(`/tinh/${prov.slug}`), c.code).toBe(true);
      for (const o of prov.codes) if (o !== c.code) expect(hs.has(`/${o}`), `${c.code}→${o}`).toBe(true);
    }
  });
  it('every province page links to each of its codes; /bang-ma links to all 81 codes and 34 provinces; footer links /bang-ma and /nguon', () => {
    for (const p of data.provinces) for (const c of p.codes) expect(hrefsOf(`tinh/${p.slug}.html`).has(`/${c}`), `${p.slug}→${c}`).toBe(true);
    const bm = hrefsOf('bang-ma.html');
    for (const c of data.codes) expect(bm.has(`/${c.code}`), c.code).toBe(true);
    for (const p of data.provinces) expect(bm.has(`/tinh/${p.slug}`), p.slug).toBe(true);
    for (const { f, h } of pages) {
      const footer = /<footer[\s\S]*<\/footer>/.exec(h)?.[0] ?? '';
      expect(footer, f).toContain('href="/bang-ma"');
      expect(footer, f).toContain('href="/nguon"');
    }
  });
  it('detail pages show a breadcrumb: Trang chủ › Tỉnh › Mã (code) / Trang chủ › Tỉnh (province)', () => {
    const crumbs = (f: string) => strip(/<nav class="crumbs"[\s\S]*?<\/nav>/.exec(read(f))?.[0] ?? '');
    expect(crumbs('83.html')).toBe('Trang chủ › Cần Thơ › Biển số 83');
    expect(crumbs('80.html')).toBe('Trang chủ › Biển số 80');
    expect(crumbs('tinh/can-tho.html')).toBe('Trang chủ › Cần Thơ');
    for (const c of data.codes) expect(read(`${c.code}.html`)).toContain('class="crumbs"');
    expect(read('83.html')).toMatch(/<a href="\/tinh\/can-tho">Cần Thơ<\/a>/);
  });
  it('no orphan: every sitemap URL is linked from at least one OTHER page', () => {
    const linked = new Map<string, Set<string>>();
    for (const { f, h } of pages) for (const l of internal(h)) {
      const p = l.href.split(/[?#]/)[0] as string;
      (linked.get(p) ?? linked.set(p, new Set()).get(p))?.add(f);
    }
    const orphans = locs.map(pathOf).filter((p) => ![...(linked.get(p) ?? [])].some((f) => f !== fileOf(p)));
    expect(orphans).toEqual([]);
  });
  it('anchor text is descriptive (no bare "xem thêm"/"tại đây"), and links are canonical (no .html, no trailing slash, no index)', () => {
    const generic = /^(xem thêm|tại đây|bấm vào đây|click here|here|more|đọc tiếp|link)$/i;
    const bad: string[] = [];
    for (const { f, h } of pages) {
      for (const l of internal(h)) {
        if (l.label.length === 0) bad.push(`${f} empty anchor ${l.href}`);
        if (generic.test(l.label)) bad.push(`${f} generic anchor "${l.label}" → ${l.href}`);
        if (/^\d{2}$/.test(l.label) && !l.tag.includes('aria-label=')) bad.push(`${f} numeric anchor without aria-label ${l.href}`);
        const path = l.href.split(/[?#]/)[0] as string;
        if ((path.length > 1 && path.endsWith('/')) || /\.html$|\/index$/.test(path)) bad.push(`${f} non-canonical href ${l.href}`);
        if (/[?]/.test(l.href) && !/\.(png|svg|css|js)$/.test(path)) bad.push(`${f} query in internal link ${l.href}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('4. JSON-LD', () => {
  const bcOf = (h: string) => ldBlocks(h).find((b) => b['@type'] === 'BreadcrumbList');
  it('BreadcrumbList matches the visible breadcrumb on every detail page (names + absolute URLs)', () => {
    for (const { f, h } of pages) {
      const nav = /<nav class="crumbs"[\s\S]*?<\/nav>/.exec(h)?.[0];
      const ld = bcOf(h);
      if (!/^(\d{2}|tinh\/.+)\.html$/.test(f)) continue;
      expect(nav, f).toBeDefined();
      expect(ld, f).toBeDefined();
      const items = (ld?.itemListElement as { position: number; name: string; item: string }[]) ?? [];
      const visible = [...(nav as string).matchAll(/<(a|span)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => ({ name: strip(m[2] as string), href: attr(m[0], 'href') }));
      expect(items.map((i) => i.name), f).toEqual(visible.map((v) => v.name));
      expect(items.map((i) => i.position)).toEqual(items.map((_, i) => i + 1));
      items.forEach((it, i) => {
        expect(it.item.startsWith(`${SITE}/`), `${f} ${it.item}`).toBe(true);
        if (visible[i]?.href) expect(pathOf(it.item)).toBe(visible[i]?.href);
        else expect(pathOf(it.item)).toBe(`/${f.replace(/\.html$/, '')}`); // current page
      });
    }
  });
  it('FAQPage on /nguon; WebSite on the home page (name, url, inLanguage vi; no SearchAction)', () => {
    const faq = ldBlocks(read('nguon.html')).find((b) => b['@type'] === 'FAQPage');
    expect((faq?.mainEntity as unknown[]).length).toBeGreaterThanOrEqual(4);
    const site = ldBlocks(read('index.html')).find((b) => b['@type'] === 'WebSite');
    expect(site).toMatchObject({ '@context': 'https://schema.org', name: 'BIEN SO', url: `${SITE}/`, inLanguage: 'vi' });
    expect(JSON.stringify(site)).not.toContain('SearchAction');
    expect(JSON.stringify(site)).not.toContain('potentialAction');
  });
  it('every JSON-LD block parses and every URL in it is absolute on SITE_URL', () => {
    for (const { f, h } of pages) {
      for (const b of ldBlocks(h)) {
        expect(b['@context'], f).toBe('https://schema.org');
        for (const u of JSON.stringify(b).match(/"(?:url|item)":"([^"]+)"/g) ?? []) expect(u.replace(/^"\w+":"/, '').startsWith(`${SITE}/`), `${f} ${u}`).toBe(true);
      }
    }
  });
});

describe('5. robots.txt & sitemap.xml', () => {
  it('robots allows crawling and gives the absolute sitemap URL', () => {
    const r = read('robots.txt');
    expect(r).toMatch(/^User-agent: \*$/m);
    expect(r).toMatch(/^Allow: \/$/m);
    expect(r).not.toMatch(/^Disallow: \/\s*$/m);
    expect(r).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });
  it('sitemap: 121 absolute URLs, lastmod = meta.lastReviewed, no 404, no duplicates', () => {
    expect(locs).toHaveLength(121);
    expect(new Set(locs).size).toBe(121);
    for (const l of locs) expect(l.startsWith('http')).toBe(true);
    const mods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    expect(mods).toHaveLength(121);
    expect(new Set(mods)).toEqual(new Set([data.meta.lastReviewed]));
    expect(sitemap).not.toContain('404');
  });
});

describe('6. technical', () => {
  it('<html lang="vi">, charset and viewport on every page', () => {
    for (const { f, h } of pages) {
      expect(h, f).toMatch(/<html lang="vi"/);
      expect(h, f).toContain('<meta charset="utf-8"');
      expect(h, f).toContain('name="viewport"');
    }
  });
  it('canonical is absolute and equals the sitemap URL for every indexed page; 404 has none and is noindex', () => {
    const fromSitemap = new Set(locs);
    const fromPages = new Set<string>();
    for (const { f, h } of indexed) {
      const c = /<link rel="canonical" href="([^"]+)"/.exec(h)?.[1];
      expect(c, f).toBeDefined();
      expect(new URL(c as string).href, f).toBe(c);
      expect(fromSitemap.has(c as string), `${f} ${c}`).toBe(true);
      expect(pathOf(c as string), f).toBe(f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}`);
      fromPages.add(c as string);
    }
    expect(fromPages).toEqual(fromSitemap);
    const nf = read('404.html');
    expect(nf).not.toContain('rel="canonical"');
    expect(nf).toMatch(/name="robots" content="noindex/);
  });
  it('OG + Twitter tags complete, image absolute and 1200×630', () => {
    for (const { f, h } of indexed) {
      for (const k of ['og:type', 'og:site_name', 'og:locale', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
        expect(meta(h, k), `${f} ${k}`).toBeTruthy();
      }
      expect(meta(h, 'og:title')).toBe(title(h));
      const og = meta(h, 'og:image') as string;
      expect(og.startsWith(`${SITE}/og/`)).toBe(true);
      // Every static page uses the brand default image; only /[code] has its own.
      if (!/^\d{2}\.html$/.test(f)) expect(og, f).toBe(`${SITE}/og/default.png`);
      expect(meta(h, 'og:image:width')).toBe('1200');
      expect(meta(h, 'twitter:card')).toBe('summary_large_image');
    }
  });
  it('every <img> has alt text attribute and fixed width/height', () => {
    for (const { f, h } of pages) for (const m of h.matchAll(/<img\b[^>]*>/g)) {
      expect(m[0], f).toMatch(/\salt="/);
      expect(m[0], f).toMatch(/\swidth="\d+"/);
      expect(m[0], f).toMatch(/\sheight="\d+"/);
    }
  });
});

describe('7. /nguon advertising section', () => {
  it('explains the "Quảng cáo" label and carries no offers', () => {
    const h = read('nguon.html');
    expect(h).toContain('Quảng cáo trên BIEN SO');
    expect(strip(h)).toContain('Khu có nhãn "Quảng cáo" là liên kết tiếp thị');
    expect(strip(h)).toContain('có thể nhận hoa hồng');
    expect(strip(h)).toContain('Quảng cáo không ảnh hưởng đến dữ liệu tra cứu');
    expect(h).not.toMatch(/class="offers"|class="featured"|sponsored/);
  });
});
