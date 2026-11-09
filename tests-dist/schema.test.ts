import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import data from '../data/plate-codes.json';

// Structured data audit over the built site: one @graph per page, stable @ids, no forbidden types.
const files = readdirSync('dist', { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.html'));
const read = (f: string) => readFileSync(join('dist', f), 'utf8');
const un = (s: string) => s.replace(/&#38;|&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;|&#34;/g, '"');
const strip = (s: string) => un(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const blocks = (h: string) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse((m[1] as string).replace(/\\u003c/g, '<')) as Record<string, unknown>);
type N = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const graph = (h: string): N[] => (blocks(h)[0]?.['@graph'] as N[]) ?? [];
const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] as string);
const SITE = new URL(locs[0] as string).origin;
const pages = files.filter((f) => f !== '404.html').map((f) => ({ f, h: read(f), path: f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}` }));
const canonical = (h: string) => /<link rel="canonical" href="([^"]+)"/.exec(h)?.[1] as string;
const metaDesc = (h: string) => un(/<meta name="description" content="([^"]*)"/.exec(h)?.[1] ?? '');
const title = (h: string) => strip(/<title>([\s\S]*?)<\/title>/.exec(h)?.[1] ?? '');
const h1 = (h: string) => strip(/<h1[\s\S]*?<\/h1>/.exec(h)?.[0] ?? '');
const FORBIDDEN = ['Product', 'Review', 'AggregateRating', 'GovernmentOrganization', 'LocalBusiness', 'Person', 'SearchAction', 'potentialAction'];
const ARTICLE_FILES = files.filter((f) => f.startsWith('kien-thuc/'));

describe('JSON-LD @graph on every indexed page', () => {
  it('exactly one parseable block per page, with @context and a non-empty @graph', () => {
    for (const { f, h } of pages) {
      expect(blocks(h), f).toHaveLength(1);
      expect(blocks(h)[0]?.['@context'], f).toBe('https://schema.org');
      expect(graph(h).length, f).toBeGreaterThanOrEqual(3 - (f === 'index.html' ? 0 : 1));
    }
    expect(blocks(read('404.html'))).toHaveLength(0); // noindex utility page: no markup
  });
  it('Organization on every page: minimal, identical everywhere, logo = absolute 512 icon', () => {
    const orgs = new Set<string>();
    for (const { f, h } of pages) {
      const o = graph(h).filter((n) => n['@type'] === 'Organization');
      expect(o, f).toHaveLength(1);
      orgs.add(JSON.stringify(o[0]));
      expect(Object.keys(o[0] as N).sort(), f).toEqual(['@id', '@type', 'logo', 'name', 'url']);
    }
    expect(orgs.size).toBe(1);
    const o = graph(read('index.html')).find((n) => n['@type'] === 'Organization') as N;
    expect(o).toMatchObject({ '@id': `${SITE}/#organization`, name: 'Biển Số', url: `${SITE}/`, logo: { url: `${SITE}/icon-512.png`, width: 512, height: 512 } });
  });
  it('WebSite is defined in full only on / and referenced by @id elsewhere', () => {
    for (const { f, h } of pages) {
      const ws = graph(h).filter((n) => n['@type'] === 'WebSite');
      expect(ws, f).toHaveLength(f === 'index.html' ? 1 : 0);
      const wp = graph(h).find((n) => String(n['@id']).endsWith('#webpage')) as N;
      expect(wp.isPartOf, f).toEqual({ '@id': `${SITE}/#website` });
    }
    expect(graph(read('index.html')).find((n) => n['@type'] === 'WebSite')).toMatchObject({ '@id': `${SITE}/#website`, name: 'Biển Số', url: `${SITE}/`, inLanguage: 'vi', publisher: { '@id': `${SITE}/#organization` } });
  });
  it('WebPage node: @id = canonical#webpage, url = canonical, name/description = title/meta description', () => {
    for (const { f, h } of pages) {
      const wp = graph(h).find((n) => String(n['@id']).endsWith('#webpage')) as N;
      expect(wp['@id'], f).toBe(`${canonical(h)}#webpage`);
      expect(wp.url, f).toBe(canonical(h));
      expect(wp.name, f).toBe(title(h));
      expect(wp.description, f).toBe(metaDesc(h));
      expect(wp.inLanguage).toBe('vi');
    }
  });
  it('page types: / WebPage, /bang-ma + /kien-thuc CollectionPage, the rest WebPage', () => {
    const type = (f: string) => (graph(read(f)).find((n) => String(n['@id']).endsWith('#webpage')) as N)['@type'];
    expect(type('index.html')).toBe('WebPage');
    expect(type('bang-ma.html')).toBe('CollectionPage');
    expect(type('kien-thuc.html')).toBe('CollectionPage');
    for (const f of ['83.html', '80.html', 'tinh/can-tho.html', 'nguon.html', ...ARTICLE_FILES.filter((x) => x !== 'kien-thuc.html')]) expect(type(f), f).toBe('WebPage');
  });
  it('every @id is defined once per page (no conflicting duplicates) and every reference resolves on the page or is a site-level id', () => {
    for (const { f, h } of pages) {
      const defs = graph(h).map((n) => n['@id']).filter(Boolean) as string[];
      expect(new Set(defs).size, `${f} duplicate @id`).toBe(defs.length);
      const refs = [...JSON.stringify(graph(h)).matchAll(/\{"@id":"([^"]+)"\}/g)].map((m) => m[1] as string);
      for (const r of refs) expect(defs.includes(r) || r === `${SITE}/#website`, `${f} unresolved ${r}`).toBe(true);
    }
  });
  it('same @id is defined identically across pages (Organization, WebSite)', () => {
    const seen = new Map<string, string>();
    for (const { f, h } of pages) for (const n of graph(h)) {
      const id = String(n['@id']);
      if (!id.endsWith('#organization') && !id.endsWith('#website')) continue;
      expect(seen.get(id) ?? JSON.stringify(n), f).toBe(JSON.stringify(n));
      seen.set(id, JSON.stringify(n));
    }
  });
  it('every URL in the graph is absolute on the site and points at a sitemap URL (or an asset)', () => {
    const inSitemap = new Set(locs);
    for (const { f, h } of pages) {
      for (const u of JSON.stringify(graph(h)).match(/"(?:url|item)":"([^"]+)"/g) ?? []) {
        const url = u.replace(/^"\w+":"/, '').replace(/"$/, '');
        expect(url.startsWith(`${SITE}/`), `${f} ${url}`).toBe(true);
        if (!/\.(png|svg|webp)$/.test(url)) expect(inSitemap.has(url) || url === `${SITE}/`, `${f} ${url} not in sitemap`).toBe(true);
      }
    }
  });
  it('BreadcrumbList: @id = canonical#breadcrumb, equals the visible breadcrumb; home has none', () => {
    for (const { f, h } of pages) {
      const bc = graph(h).find((n) => n['@type'] === 'BreadcrumbList');
      if (f === 'index.html') { expect(bc).toBeUndefined(); continue; }
      expect(bc?.['@id'], f).toBe(`${canonical(h)}#breadcrumb`);
      const nav = /<nav class="crumbs"[\s\S]*?<\/nav>/.exec(h)?.[0] ?? '';
      const visible = [...nav.matchAll(/<(?:a|span)\b[^>]*>([\s\S]*?)<\/(?:a|span)>/g)].map((m) => strip(m[1] as string));
      expect((bc?.itemListElement as N[]).map((i) => i.name), f).toEqual(visible);
      expect((bc?.itemListElement as N[]).at(-1)?.item, f).toBe(canonical(h));
    }
  });
});

describe('type-specific nodes', () => {
  it('/bang-ma: ItemList of the 34 province pages in displayed order', () => {
    const h = read('bang-ma.html');
    const list = graph(h).find((n) => n['@type'] === 'ItemList') as N;
    expect(list['@id']).toBe(`${SITE}/bang-ma#itemlist`);
    expect((graph(h).find((n) => n['@type'] === 'CollectionPage') as N).mainEntity).toEqual({ '@id': list['@id'] });
    expect(list.itemListElement.map((i: N) => i.url)).toEqual(data.provinces.map((p) => `${SITE}/tinh/${p.slug}`));
    expect(list.numberOfItems).toBe(34);
    // same order as the visible "Tra theo tỉnh, thành" chips
    const chips = [...h.matchAll(/class="chip chip--wide" href="(\/tinh\/[^"]+)"/g)].map((m) => `${SITE}${m[1]}`);
    expect(list.itemListElement.map((i: N) => i.url)).toEqual(chips);
  });
  it('/kien-thuc: ItemList of all articles, newest first, matching the visible cards', () => {
    const h = read('kien-thuc.html');
    const list = graph(h).find((n) => n['@type'] === 'ItemList') as N;
    const visible = [...h.matchAll(/<li><a href="(\/kien-thuc\/[^"]+)"><strong>/g)].map((m) => `${SITE}${m[1]}`);
    expect(visible).toHaveLength(ARTICLE_FILES.filter((x) => x !== 'kien-thuc.html').length);
    expect(list.itemListElement.map((i: N) => i.url)).toEqual(visible);
  });
  it('articles: Article node with headline = H1, description = meta description, author/publisher = Organization, image, mainEntityOfPage = #webpage', () => {
    for (const f of ARTICLE_FILES.filter((x) => x !== 'kien-thuc.html')) {
      const h = read(f);
      const a = graph(h).find((n) => n['@type'] === 'Article') as N;
      expect(a, f).toBeDefined();
      expect(a['@id']).toBe(`${canonical(h)}#article`);
      expect(a.headline).toBe(h1(h));
      expect(a.description).toBe(metaDesc(h));
      expect(a.inLanguage).toBe('vi');
      expect(a.author).toEqual({ '@id': `${SITE}/#organization` });
      expect(a.publisher).toEqual({ '@id': `${SITE}/#organization` });
      expect(a.mainEntityOfPage).toEqual({ '@id': `${canonical(h)}#webpage` });
      expect(a.image).toBe(`${SITE}/og/default.png`);
      expect(/<meta property="og:image" content="([^"]+)"/.exec(h)?.[1]).toBe(a.image);
    }
  });
  it('article dates come from data (publishedAt and meta.lastReviewed), never from the build date', () => {
    const published = '2026-11-09';
    for (const f of ARTICLE_FILES.filter((x) => x !== 'kien-thuc.html')) {
      const a = graph(read(f)).find((n) => n['@type'] === 'Article') as N;
      expect(a.datePublished).toBe(published);
      expect(a.dateModified).toBe(data.meta.lastReviewed > published ? data.meta.lastReviewed : published);
      expect(read(f)).toContain(`datetime="${a.datePublished}"`);
    }
  });
  it('FAQPage only on /nguon, and its questions are visible on the page', () => {
    for (const { f, h } of pages) expect(graph(h).some((n) => n['@type'] === 'FAQPage'), f).toBe(f === 'nguon.html');
    const h = read('nguon.html');
    const faq = graph(h).find((n) => n['@type'] === 'FAQPage') as N;
    for (const q of faq.mainEntity as N[]) expect(strip(h), q.name).toContain(un(q.name));
  });
  it('no forbidden types anywhere (Product, Review, AggregateRating, GovernmentOrganization, LocalBusiness, Person, SearchAction)', () => {
    for (const { f, h } of pages) {
      const types = [...JSON.stringify(graph(h)).matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1] as string);
      for (const t of FORBIDDEN) expect(types, `${f} ${t}`).not.toContain(t);
      expect(JSON.stringify(graph(h)), f).not.toMatch(/SearchAction|potentialAction|"address"|"sameAs"|"founder"|"contactPoint"/);
    }
  });
});
