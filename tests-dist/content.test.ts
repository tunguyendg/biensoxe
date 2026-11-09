import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import data from '../data/plate-codes.json';
import nq202 from '../data/sources/nq202-2025.json';
import tt51 from '../data/sources/tt51-2025-phu-luc-02.json';
import tt79 from '../data/sources/tt79-2024-phu-luc-02.json';
import { LIMITS } from '../src/lib/copy';

// SEO content V1: home block, /bang-ma, code/province sentences, /kien-thuc. Runs after `npm run build`.
const read = (f: string) => readFileSync(`dist/${f}`, 'utf8');
const un = (s: string) => s.replace(/&#38;|&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;|&#34;/g, '"');
const text = (html: string) => un(html.replace(/<(script|style|svg)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const main = (h: string) => /<main[\s\S]*?<\/main>/.exec(h)?.[0] ?? '';
const words = (s: string) => s.split(/\s+/).filter(Boolean);
const paragraphs = (html: string) => [...html.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)].map((m) => ({ cls: /class="([^"]*)"/.exec(m[1] as string)?.[1] ?? '', text: text(m[2] as string) }));
const ld = (h: string) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse((m[1] as string).replace(/\\u003c/g, '<')) as Record<string, unknown>);
const title = (h: string) => text(/<title>([\s\S]*?)<\/title>/.exec(h)?.[1] ?? '');
const desc = (h: string) => un(/<meta name="description" content="([^"]*)"/.exec(h)?.[1] ?? '');
const codes = new Set(data.codes.map((c) => c.code));
const ARTICLES = ['kien-thuc/bien-so-xe-sau-sap-nhap-2025', 'kien-thuc/cach-doc-ma-bien-so-xe'];
const KB = ['kien-thuc', ...ARTICLES];

describe('home block', () => {
  const h = main(read('index.html'));
  it('≤ 120 words, after the result card, links /bang-ma and both articles, names the source', () => {
    const block = /<section class="about"[\s\S]*?<\/section>/.exec(h)?.[0] ?? '';
    expect(block).not.toBe('');
    expect(words(text(block)).length).toBeLessThanOrEqual(120);
    for (const href of ['/bang-ma', '/kien-thuc/bien-so-xe-sau-sap-nhap-2025', '/kien-thuc/cach-doc-ma-bien-so-xe']) expect(block).toContain(`href="${href}"`);
    expect(text(block)).toContain('TT 51/2025/TT-BCA');
    expect(h.indexOf('class="about"')).toBeGreaterThan(h.indexOf('id="plate-input"'));
  });
});

describe('/bang-ma', () => {
  const html = read('bang-ma.html');
  it('H1, title with "(cập nhật YYYY)" once, intro ≤ 100 words, 3-step how-to, numbers from data', () => {
    expect(text(/<h1[\s\S]*?<\/h1>/.exec(html)?.[0] ?? '')).toBe(`Bảng biển số xe ${data.provinces.length} tỉnh thành`);
    const t = title(html);
    expect(t.match(/\(cập nhật \d{4}\)/g)).toHaveLength(1);
    expect(t).toContain(`(cập nhật ${data.meta.lastReviewed.slice(0, 4)})`);
    expect(words(t).join(' ').length).toBeLessThanOrEqual(60);
    const intro = /<p class="intro">([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '';
    expect(words(text(intro)).length).toBeLessThanOrEqual(100);
    expect(text(intro)).toContain(`${data.codes.length} mã`);
    expect(text(intro)).toContain(`${data.provinces.length} tỉnh`);
    const formers = new Set(data.codes.flatMap((c) => (c.formerProvince ? [c.formerProvince] : [])));
    expect(formers.size).toBe(63);
    expect(text(intro)).toContain(`${formers.size} đơn vị cũ`);
    const howto = /<section[^>]*class="howto"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    expect(howto.match(/<li>/g)).toHaveLength(3);
  });
  it('links every province page', () => {
    for (const p of data.provinces) expect(html).toContain(`href="/tinh/${p.slug}"`);
  });
});

describe('/80', () => {
  const html = read('80.html');
  it('direct answer first, with source URLs, no guesses about vehicles or agencies', () => {
    const m = main(html);
    const special = tt51.special.find((s) => s.codes.includes('80'))?.name;
    const answer = `Biển số 80 không thuộc tỉnh nào. Theo Phụ lục 02 TT 51/2025/TT-BCA, ký hiệu 80 dành cho ${special}.`;
    expect(paragraphs(m).find((p) => p.cls === 'answer')?.text).toBe(answer);
    expect(m.indexOf('class="answer"')).toBeLessThan(m.indexOf('class="card'));
    expect(m).toContain(`href="${tt51.meta.gazetteUrl}"`);
    expect(m).toContain(`href="${tt51.meta.transcribedFrom}"`);
    expect(text(m)).not.toMatch(/xe công|xe quân|xe chuyên dụng/);
    expect(text(m)).toContain(LIMITS);
  });
});

describe('code pages: data-generated sentences', () => {
  const pages = data.codes.filter((c) => c.type === 'province').map((c) => ({ code: c.code, m: main(read(`${c.code}.html`)) }));
  it('/83, /27 and /75 say the right thing', () => {
    const facts = (code: string) => paragraphs(pages.find((p) => p.code === code)?.m ?? '').find((p) => p.cls === 'facts')?.text;
    expect(facts('52')).toBe('Mã 52 là một trong 13 mã biển của TP. Hồ Chí Minh.');
    expect(facts('83')).toBe('Trước 01/07/2025, mã 83 là của Sóc Trăng. Sóc Trăng nay thuộc Cần Thơ, cùng với Hậu Giang. Cần Thơ hiện dùng 3 mã: 65, 83, 95.');
    expect(facts('27')).toBe('Điện Biên không thay đổi sau sắp xếp hành chính 2025 và chỉ dùng mã 27.');
    expect(facts('75')).toBe('Huế không thay đổi sau sắp xếp hành chính 2025 và chỉ dùng mã 75.');
    expect(pages.find((p) => p.code === '75')?.m).toContain("ghi tên địa phương là 'Thừa Thiên Huế'".replace(/'/g, '&#39;'));
  });
  it('every province code page has 1–3 sentences right after the card, naming real data', () => {
    for (const { code, m } of pages) {
      const f = paragraphs(m).find((p) => p.cls === 'facts');
      expect(f, code).toBeDefined();
      const sentences = (f?.text.replace(/TP\./g, 'TP').match(/[.!?](\s|$)/g) ?? []).length;
      expect(sentences, code).toBeGreaterThanOrEqual(1);
      expect(sentences, code).toBeLessThanOrEqual(3);
      expect(m.indexOf('class="facts"'), code).toBeGreaterThan(m.indexOf('data-share'));
    }
  });
  it('no run of ≥ 20 identical words appears on more than 10 code pages (limits line and source line excluded)', () => {
    const seen = new Map<string, Set<string>>();
    for (const { code, m } of pages) {
      // Drop the limits line, the source line, the ad block (identical by design) and non-paragraph chrome.
      const body = m.replace(/<section class="offers[\s\S]*?<\/section>/g, '');
      const ps = paragraphs(body).filter((p) => !/\b(limits|source)\b/.test(p.cls) && p.text !== LIMITS && !p.text.startsWith('Nguồn:'));
      for (const p of ps) {
        const w = words(p.text);
        for (let i = 0; i + 20 <= w.length; i++) {
          const k = w.slice(i, i + 20).join(' ');
          (seen.get(k) ?? seen.set(k, new Set()).get(k))?.add(code);
        }
      }
    }
    const dup = [...seen].filter(([, s]) => s.size > 10).map(([k, s]) => `${s.size}× ${k}`);
    expect(dup).toEqual([]);
  });
  it('province pages carry the summary sentence', () => {
    for (const p of data.provinces) {
      const t = text(main(read(`tinh/${p.slug}.html`)));
      expect(t, p.slug).toContain(`${p.name} ${p.mergedFrom.length ? 'hiện dùng' : 'dùng'} ${p.codes.length <= 6 ? `${p.codes.length} mã: ${p.codes.join(', ')}` : `${p.codes.length} mã biển`}`);
    }
  });
});

describe('/kien-thuc', () => {
  it('3 pages: 1 H1, title ≤ 60, description 120–160, canonical, breadcrumb = JSON-LD, footer link', () => {
    for (const f of KB) {
      const h = read(`${f}.html`);
      expect(h.match(/<h1[\s>]/g), f).toHaveLength(1);
      expect(title(h).length, f).toBeLessThanOrEqual(60);
      expect(desc(h).length, f).toBeGreaterThanOrEqual(120);
      expect(desc(h).length, f).toBeLessThanOrEqual(160);
      expect(h, f).toMatch(new RegExp(`<link rel="canonical" href="[^"]+/${f}"`));
      expect(h, f).toContain('href="/kien-thuc">Kiến thức</a>');
      const bc = ld(h).find((x) => x['@type'] === 'BreadcrumbList') as { itemListElement: { name: string; item: string }[] };
      const visible = [...(/<nav class="crumbs"[\s\S]*?<\/nav>/.exec(h)?.[0] ?? '').matchAll(/<(?:a|span)\b[^>]*>([^<]*)<\/(?:a|span)>/g)].map((m) => un(m[1] as string));
      expect(bc.itemListElement.map((i) => i.name), f).toEqual(visible);
      expect(bc.itemListElement[1]?.name).toBe('Kiến thức');
    }
  });
  it('titles and H1s are unique across the site', () => {
    const all = new Map<string, string>();
    for (const f of [...KB, 'index', 'bang-ma', 'nguon', '83', 'tinh/can-tho']) {
      const h = read(`${f}.html`);
      for (const k of new Set([title(h), text(/<h1[\s\S]*?<\/h1>/.exec(h)?.[0] ?? '')])) {
        expect(all.get(k), `${k} (${f}) duplicates ${all.get(k)}`).toBeUndefined();
        all.set(k, f);
      }
    }
  });
  it('the 2 articles carry Article JSON-LD (no FAQPage), datePublished = publishedAt, dateModified = max(publishedAt, lastReviewed), and a Nguồn section with real URLs', () => {
    for (const f of ARTICLES) {
      const h = read(`${f}.html`);
      const art = ld(h).find((x) => x['@type'] === 'Article') as Record<string, unknown>;
      expect(art.inLanguage).toBe('vi');
      expect(art.datePublished).toBe('2026-11-09');
      const modified = data.meta.lastReviewed > '2026-11-09' ? data.meta.lastReviewed : '2026-11-09';
      expect(art.dateModified).toBe(modified);
      expect(text(main(h))).toContain('Đăng ngày 09/11/2026');
      expect(text(main(h)).includes('Cập nhật')).toBe(modified !== '2026-11-09');
      expect(art.headline).toBe(text(/<h1[\s\S]*?<\/h1>/.exec(h)?.[0] ?? ''));
      expect((art.publisher as { name: string }).name).toBe('Biển Số');
      expect(ld(h).some((x) => x['@type'] === 'FAQPage')).toBe(false);
      for (const url of [tt51.meta.gazetteUrl, tt51.meta.transcribedFrom, nq202.meta.pdf, tt79.meta.transcribedFrom]) expect(h, `${f} ${url}`).toContain(`href="${url}"`);
      expect(h).toContain('<h2 id="sources-h">Nguồn</h2>');
      expect(h).toContain('datetime="2026-11-09"');
    }
  });
  it('articles cross-link each other, /bang-ma and ≥ 5 code/province pages; no ads on /kien-thuc/*', () => {
    for (const f of ARTICLES) {
      const h = read(`${f}.html`);
      const other = ARTICLES.find((x) => x !== f) as string;
      expect(h).toContain(`href="/${other}"`);
      expect(h).toContain('href="/bang-ma"');
      const targets = new Set([...h.matchAll(/href="\/((?:tinh\/)?[\w-]+)"/g)].map((m) => m[1] as string).filter((p) => /^\d{2}$/.test(p) || p.startsWith('tinh/')));
      expect(targets.size, f).toBeGreaterThanOrEqual(5 - 1); // see next assertion for the combined count
    }
    const combined = new Set(ARTICLES.flatMap((f) => [...read(`${f}.html`).matchAll(/href="\/((?:tinh\/)?[\w-]+)"/g)].map((m) => m[1] as string).filter((p) => /^\d{2}$/.test(p) || p.startsWith('tinh/'))));
    expect(combined.size).toBeGreaterThanOrEqual(5);
    for (const f of KB) {
      const h = read(`${f}.html`);
      expect(h, f).not.toContain('Quảng cáo');
      expect(h, f).not.toContain('class="featured');
    }
  });
  it('no affirmative "bắt buộc đổi biển"; the default sentence is used', () => {
    const DEFAULT = 'Chưa thấy quy định bắt buộc đổi biển; hỏi công an nơi đăng ký để chắc chắn.';
    const a = text(main(read(`${ARTICLES[0]}.html`)));
    expect(a).toContain(DEFAULT);
    for (const f of ARTICLES) {
      const t = text(main(read(`${f}.html`))).replace(DEFAULT, '').replace(/không, tự nó, buộc phải đổi biển/g, '');
      expect(t, f).not.toMatch(/bắt buộc đổi biển|phải đổi biển|cần đổi biển|thủ tục đổi biển/i);
    }
  });
  it('every plate code mentioned exists in the data; the limits line is verbatim', () => {
    for (const f of ARTICLES) {
      const m = main(read(`${f}.html`));
      const t = text(m);
      const mentioned = [...t.matchAll(/(?:[Bb]iển số|[Mm]ã|[Bb]iển) (\d{2})\b/g)].map((x) => x[1] as string);
      expect(mentioned.length, f).toBeGreaterThan(0);
      for (const c of mentioned) expect(codes.has(c), `${f}: ${c}`).toBe(true);
    }
    expect(text(main(read(`${ARTICLES[1]}.html`)))).toContain(LIMITS);
  });
  it('claims limited to the sources: 63 → 34, NQ 202 dates, TT 51 dates (all read from the data files)', () => {
    const t = text(main(read(`${ARTICLES[0]}.html`)));
    expect(t).toContain('63 đơn vị thành 34');
    expect(t).toContain('12/06/2025');
    expect(t).toContain('01/07/2025');
    expect(t).not.toContain('cần kiểm chứng thêm');
    expect(t).toContain('30/06/2025');
    expect(nq202.meta.adopted).toBe('2025-06-12');
  });
});
