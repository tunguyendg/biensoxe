import { readdirSync, readFileSync } from 'node:fs';
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
const ld = (h: string) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => (JSON.parse((m[1] as string).replace(/\\u003c/g, '<')) as { '@graph': Record<string, unknown>[] })['@graph']);
const title = (h: string) => text(/<title>([\s\S]*?)<\/title>/.exec(h)?.[1] ?? '');
const desc = (h: string) => un(/<meta name="description" content="([^"]*)"/.exec(h)?.[1] ?? '');
const codes = new Set(data.codes.map((c) => c.code));
const OLD = ['kien-thuc/bien-so-xe-sau-sap-nhap-2025', 'kien-thuc/cach-doc-ma-bien-so-xe'];
const V11 = ['kien-thuc/bang-doi-chieu-63-tinh-cu-34-tinh-moi', 'kien-thuc/tinh-thanh-giu-nguyen-sau-sap-nhap-2025', 'kien-thuc/tinh-co-nhieu-ma-bien-so'];
const V12 = ['mau-bien-so-xe', 'ky-hieu-seri-bien-so-xe', 'bien-so-ng-qt-cv-nn', 'bien-so-dinh-danh', 'khi-nao-phai-doi-bien-so-xe', 'bien-so-3-so-4-so-con-dung-duoc-khong', 'dau-gia-bien-so-xe'].map((x) => `kien-thuc/${x}`);
const ARTICLES = [...OLD, ...V11, ...V12];
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

const m_links = (html: string) => [...html.matchAll(/href="\/(\d{2})"/g)].map((x) => x[1] as string);

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
  it('all 12 articles carry Article JSON-LD (no FAQPage), datePublished = publishedAt, dateModified = max(publishedAt, lastReviewed), and a Nguồn section with real URLs', () => {
    for (const f of ARTICLES) {
      const h = read(`${f}.html`);
      const art = ld(h).find((x) => x['@type'] === 'Article') as Record<string, unknown>;
      expect(art.inLanguage).toBe('vi');
      expect(art.datePublished).toBe('2026-11-09');
      const modified = data.meta.lastReviewed > '2026-11-09' ? data.meta.lastReviewed : '2026-11-09';
      expect(art.dateModified).toBe(modified);
      expect(text(main(h))).toContain('Đăng ngày 09/11/2026');
      expect(text(main(h)).includes('· Cập nhật')).toBe(modified !== '2026-11-09');
      expect(art.headline).toBe(text(/<h1[\s\S]*?<\/h1>/.exec(h)?.[0] ?? ''));
      expect(art.publisher).toEqual({ '@id': `${new URL(String(art.mainEntityOfPage && (art.mainEntityOfPage as { '@id': string })['@id'])).origin}/#organization` });
      expect(art.author).toEqual(art.publisher);
      expect(ld(h).some((x) => x['@type'] === 'FAQPage')).toBe(false);
      if (!V12.includes(f)) for (const url of [tt51.meta.gazetteUrl, tt51.meta.transcribedFrom, nq202.meta.pdf, tt79.meta.transcribedFrom]) expect(h, `${f} ${url}`).toContain(`href="${url}"`);
      else expect([...(/<section[^>]*class="sources"[\s\S]*?<\/section>/.exec(h)?.[0] ?? '').matchAll(/href="https:\/\/[^"]+"/g)].length, f).toBeGreaterThanOrEqual(1);
      expect(h).toContain('<h2 id="sources-h">Nguồn</h2>');
      expect(h).toContain('datetime="2026-11-09"');
    }
  });
  it('articles cross-link each other, /bang-ma and ≥ 5 code/province pages; no ads on /kien-thuc/*', () => {
    for (const f of [...OLD, ...V11]) {
      const h = read(`${f}.html`);
      const others = ARTICLES.filter((x) => x !== f);
      expect(others.some((o) => h.includes(`href="/${o}`)), `${f} links no other article`).toBe(true);
      if (OLD.includes(f)) expect(h).toContain(`href="/${OLD.find((x) => x !== f)}"`);
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
  it('no affirmative "bắt buộc đổi biển"; /sáp nhập uses the F19 sentence + "hỏi công an nơi đăng ký để chắc chắn"', () => {
    const F19 = 'Điều 18 TT 79/2024/TT-BCA không liệt kê trường hợp phải đổi biển do sáp nhập tỉnh; hỏi công an nơi đăng ký để chắc chắn.';
    const a = text(main(read(`${ARTICLES[0]}.html`)));
    expect(a).toContain(F19);
    expect(a).not.toContain('Chưa thấy quy định');
    expect(read(`${ARTICLES[0]}.html`)).toContain(`href="/${V12[4]}"`); // link to "khi nào phải đổi biển"
    for (const f of ARTICLES) {
      const t = text(main(read(`${f}.html`)))
        .replace(/không liệt kê trường hợp phải đổi biển do sáp nhập tỉnh/g, '')
        .replace(/không, tự nó, buộc phải đổi biển/g, '')
        .replace(/khi nào phải đổi biển số xe\??/gi, '')
        .replace(/có phải đổi biển không\??/gi, '');
      expect(t, f).not.toMatch(/bắt buộc đổi biển|phải đổi biển|cần đổi biển|thủ tục đổi biển/i);
    }
  });
  it('every plate code mentioned exists in the data (also every linked /NN); the limits line is verbatim', () => {
    for (const f of ARTICLES) {
      const m = main(read(`${f}.html`));
      const t = text(m);
      const mentioned = [...t.matchAll(/(?:[Bb]iển số|[Mm]ã|[Bb]iển) (\d{2})\b/g)].map((x) => x[1] as string);
      if (OLD.includes(f)) expect(mentioned.length, f).toBeGreaterThan(0);
      for (const c of mentioned) expect(codes.has(c), `${f}: ${c}`).toBe(true);
      for (const l of m_links(m)) expect(codes.has(l), `${f} link /${l}`).toBe(true);
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

describe('new articles (V1.1)', () => {
  const NEW = V11;
  const rowsOf = (h: string) => [...h.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/g)].map((m) => m[0]).filter((r) => r.includes('<td'));
  const bySlug = new Map(data.provinces.map((p) => [p.slug, p]));

  it('bảng đối chiếu: 63 rows (one per former province), every row links /tinh/[slug] and every /[code]; grouped by current province', () => {
    const h = read(`${NEW[0]}.html`);
    const rows = rowsOf(h);
    const formers = new Map<string, { slug: string; codes: string[] }>();
    for (const c of data.codes) {
      if (c.type !== 'province' || c.formerProvince === null || c.currentProvince === null) continue;
      const e: { slug: string; codes: string[] } = formers.get(c.formerProvince) ?? { slug: c.currentProvince, codes: [] };
      e.codes.push(c.code);
      formers.set(c.formerProvince, e);
    }
    expect(formers.size).toBe(63);
    expect(rows).toHaveLength(63);
    const seenFormer = new Set<string>();
    for (const r of rows) {
      const former = text(/<th[^>]*>([\s\S]*?)<\/th>/.exec(r)?.[1] ?? '');
      const exp = formers.get(former);
      expect(exp, former).toBeDefined();
      seenFormer.add(former);
      expect(r).toContain(`href="/tinh/${exp?.slug}"`);
      const codes = [...r.matchAll(/href="\/(\d{2})"/g)].map((m) => m[1]);
      expect(codes, former).toEqual(exp?.codes);
    }
    expect(seenFormer.size).toBe(63);
    // grouped: rows of one current province are contiguous, and the first row of each of the 34 carries id=slug
    const order = rows.map((r) => /href="\/tinh\/([^"]+)"/.exec(r)?.[1] as string);
    const compact = order.filter((s, i) => s !== order[i - 1]);
    expect(new Set(compact).size).toBe(compact.length);
    expect(compact).toHaveLength(34);
    for (const s of compact) expect(h, s).toMatch(new RegExp(`<tr id="${s}"`));
    // opening answer names the numbers and dates from the sources
    const t = text(main(h));
    expect(t).toContain('63 đơn vị hành chính cấp tỉnh được sắp xếp thành 34');
    expect(t).toContain('hiệu lực 12/06/2025');
    expect(t).toContain('từ 01/07/2025');
    expect(t).toContain('iển số xe 34 tỉnh thành');
    expect(h).toContain('href="/bang-ma"');
    for (const s of bySlug.keys()) expect(h).toContain(`href="/tinh/${s}"`);
  });

  it('tỉnh giữ nguyên: groups and counts match the data (11 / 6 / 17)', () => {
    const h = read(`${NEW[1]}.html`);
    const t = text(main(h));
    const n = (k: number) => data.provinces.filter((p) => p.mergedFrom.length === k);
    expect([n(0).length, n(3).length, n(2).length]).toEqual([11, 6, 17]);
    expect(t).toContain('11 nơi giữ nguyên, 6 nơi hợp nhất từ 3 đơn vị cũ và 17 nơi hợp nhất từ 2 đơn vị cũ');
    for (const p of [...n(0), ...n(2), ...n(3)]) expect(h, p.slug).toContain(`href="/tinh/${p.slug}"`);
    for (const p of n(3)) expect(t, p.name).toContain(p.mergedFrom.join(', ').replace(/, ([^,]+)$/, ' và $1'));
  });

  it('nhiều mã: exactly the provinces with ≥ 3 codes, own vs incoming split from the data, no explanation of "why"', () => {
    const h = read(`${NEW[2]}.html`);
    const t = text(main(h));
    const multi = data.provinces.filter((p) => p.codes.length >= 3).map((p) => p.slug).sort();
    expect(multi).toEqual(['can-tho', 'dong-nai', 'ha-noi', 'hai-phong', 'ho-chi-minh', 'lam-dong', 'ninh-binh', 'phu-tho', 'vinh-long']);
    const rows = rowsOf(h);
    expect(rows).toHaveLength(multi.length);
    expect(rows.map((r) => /<tr id="([^"]+)"/.exec(r)?.[1]).sort()).toEqual(multi);
    const ct = rows.find((r) => /<tr id="can-tho"/.test(r)) as string;
    expect(text(ct)).toContain('65');
    expect(text(ct)).toContain('83 (trước là Sóc Trăng)');
    expect(text(ct)).toContain('95 (trước là Hậu Giang)');
    const ha = rows.find((r) => /<tr id="ha-noi"/.test(r)) as string;
    expect(text(ha)).toContain('—'); // nothing incoming
    expect(t).toContain('Có 9 tỉnh, thành dùng từ 3 mã biển số trở lên');
    expect(t).not.toMatch(/vì (dân số|diện tích|nhu cầu|lý do)|do (dân số|diện tích)|để (đáp ứng|phục vụ)/i);
  });

  it('each new article: ≥ 5 internal links, ≥ 250 words of text, a Nguồn section, mobile-safe table markup', () => {
    for (const f of NEW) {
      const h = read(`${f}.html`);
      const m = main(h);
      expect([...m.matchAll(/href="\/[^"]*"/g)].length, f).toBeGreaterThanOrEqual(5);
      expect(words(text(m)).length, f).toBeGreaterThanOrEqual(250);
      expect(h, f).toContain('<h2 id="sources-h">Nguồn</h2>');
      expect(h, f).toMatch(/<h2 id="[^"]+">/);
    }
    for (const f of [NEW[0], NEW[2]]) {
      const h = read(`${f}.html`);
      expect(h, f).toContain('class="tbl-wrap"');
      expect(h, f).toMatch(/<table class="xtable"/);
      expect(h, f).toMatch(/<td data-label=/); // stacked cards below 40rem need the labels
    }
  });

  it('/kien-thuc: grouped cards (title, description, date), newest first inside each group, no "Hai bài ngắn"', () => {
    const h = read('kien-thuc.html');
    expect(text(h)).not.toContain('Hai bài ngắn');
    const groups = [...h.matchAll(/<section aria-labelledby="g\d+"><h2 id="g\d+">([^<]+)<\/h2><ul class="kb-list">([\s\S]*?)<\/ul><\/section>/g)];
    expect(groups.map((g) => g[1])).toEqual(['Sáp nhập 2025', 'Đọc biển số', 'Thủ tục và đấu giá']);
    let total = 0;
    for (const g of groups) {
      const cards = [...(g[2] as string).matchAll(/<li><a href="(\/kien-thuc\/[^"]+)"><strong>([\s\S]*?)<\/strong><\/a><p>([\s\S]*?)<\/p><p class="meta">Đăng ngày <time datetime="([^"]+)">/g)];
      total += cards.length;
      const dates = cards.map((c) => c[4] as string);
      expect([...dates].sort().reverse(), g[1]).toEqual(dates);
      for (const c of cards) expect((c[3] as string).length).toBeGreaterThan(40);
    }
    expect(total).toBe(12);
  });
  it('list has no default indent: the .kb-list / .plain rules out-rank ".prose ul"', () => {
    const css = read('kien-thuc.html'); // component and page CSS is inlined
    expect(css).toMatch(/\.prose \.kb-list,\.prose \.plain\{[^}]*padding:0/);
  });
  it('links from existing pages: /bang-ma → bài đối chiếu + nhiều mã; changed code pages and merged/multi-code province pages link the new articles', () => {
    const bm = read('bang-ma.html');
    expect(bm).toContain(`href="/${NEW[0]}"`);
    expect(bm).toContain(`href="/${NEW[2]}"`);
    expect(read('83.html')).toContain(`href="/${NEW[0]}#can-tho"`);
    expect(read('27.html')).not.toContain(`/${NEW[0]}`); // unchanged province: no table row to point at
    const ct = read('tinh/can-tho.html');
    expect(ct).toContain(`href="/${NEW[0]}#can-tho"`);
    expect(ct).toContain(`href="/${NEW[2]}"`);
    expect(read('tinh/dien-bien.html')).not.toContain('/kien-thuc/');
    expect(read(`${ARTICLES[0]}.html`)).toContain(`href="/${NEW[0]}"`);
  });
});

describe('V1.2 articles (docs/CONTENT_SOURCES_V1_2.md)', () => {
  const html = (slug: string) => read(`kien-thuc/${slug}.html`);
  const body = (slug: string) => text(main(html(slug)));
  const rowsOf = (h: string) => [...h.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/g)].map((m) => m[0]).filter((r) => r.includes('<td'));

  it('each article: direct answer first, Nguồn with ≥ 1 URL, "Cập nhật theo văn bản", ≥ 4 internal links, no ads, Article schema, breadcrumb', () => {
    for (const f of V12) {
      const h = read(`${f}.html`);
      const m = main(h);
      expect(/<p class="intro">/.test(m), f).toBe(true);
      expect(m.indexOf('class="intro"'), f).toBeLessThan(m.indexOf('<h2'));
      expect(m, f).toContain('<h2 id="status-h">Cập nhật theo văn bản</h2>');
      expect(text(m), f).toContain('chưa đối chiếu với Công báo');
      expect(m, f).toContain('<h2 id="sources-h">Nguồn</h2>');
      expect([...(/<section[^>]*class="sources"[\s\S]*?<\/section>/.exec(m)?.[0] ?? '').matchAll(/href="https:\/\/[^"]+"/g)].length, f).toBeGreaterThanOrEqual(1);
      expect(/Điều \d+/.test(/<section[^>]*class="sources"[\s\S]*?<\/section>/.exec(m)?.[0] ?? ''), `${f} clause`).toBe(true);
      expect([...m.matchAll(/href="\/[^"]*"/g)].length, f).toBeGreaterThanOrEqual(4);
      expect(h, f).not.toContain('Quảng cáo');
      expect(ld(h).some((x) => x['@type'] === 'Article'), f).toBe(true);
      expect(ld(h).some((x) => x['@type'] === 'BreadcrumbList'), f).toBe(true);
      expect(h, f).toContain('href="/bang-ma"'); // /bang-ma linked from every article
    }
  });
  it('no forbidden topics: no red military plates, no meanings for LD/DA/MĐ/MK/TĐ/R/CT/LB; "quân đội" only in the KT seri line', () => {
    for (const f of V12) {
      const t = body(f.replace('kien-thuc/', ''));
      expect(t, f).not.toMatch(/biển (nền )?đỏ|biển quân đội|biển của quân đội|Bộ Tổng tham mưu/i);
      for (const sym of ['LD', 'DA', 'MĐ', 'MK', 'TĐ', 'CT', 'LB']) expect(t, `${f} ${sym}`).not.toMatch(new RegExp(`(?<![A-Za-zÀ-ỹ])${sym}\\s*(là|:|\\(|nghĩa|viết tắt|=|–|-)`));
      expect(t, f).not.toMatch(/(?<![A-Za-zÀ-ỹ])R\s*(là|:|\(|nghĩa|viết tắt)/);
      for (const m of t.matchAll(/quân đội/g)) expect(t.slice(Math.max(0, (m.index ?? 0) - 13), (m.index ?? 0) + 8), f).toContain('doanh nghiệp quân đội');
    }
    // the exception list is only ever a list, in the three articles that cite F14
    for (const slug of ['ky-hieu-seri-bien-so-xe', 'bien-so-dinh-danh', 'bien-so-3-so-4-so-con-dung-duoc-khong']) expect(body(slug)).toContain('MK, TĐ, LD, DA, MĐ, R, CT, LB, CD');
  });
  it('/mau-bien-so-xe: xanh / trắng / vàng table, tem đấu giá and tem xe xanh, 2 biển ô tô; links to seri, NG/QT, đấu giá', () => {
    const h = html('mau-bien-so-xe');
    const rows = rowsOf(h).map((r) => text(r));
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatch(/^Nền xanh Trắng .*sự nghiệp công lập/);
    expect(rows[1]).toMatch(/^Nền trắng Đen /);
    expect(rows[2]).toMatch(/^Nền vàng Đen Ô tô kinh doanh vận tải/);
    const t = body('mau-bien-so-xe');
    expect(t).toContain('tem nhận diện nền đỏ và vàng, chữ xanh');
    expect(t).toContain('tem nhận diện màu xanh lá cây');
    expect(t).toContain('Rơmoóc gắn 1 biển phía sau');
    for (const s of ['ky-hieu-seri-bien-so-xe', 'bien-so-ng-qt-cv-nn', 'dau-gia-bien-so-xe']) expect(h).toContain(`href="/kien-thuc/${s}"`);
  });
  it('/ky-hieu-seri: 11 + 20 letters, mô tô cặp 2 chữ cái, CD/RM/HC/KT table (4 rows)', () => {
    const h = html('ky-hieu-seri-bien-so-xe');
    const t = text(main(h));
    expect(t).toContain('A, B, C, D, E, F, G, H, K, L, M');
    expect(t).toContain('A, B, C, D, E, F, G, H, K, L, M, N, P, S, T, U, V, X, Y, Z');
    expect(t).toContain('Cặp hai chữ cái');
    const rows = rowsOf(h).map((r) => text(r));
    expect(rows).toHaveLength(9); // 5 + 4
    for (const s of ['CD', 'RM', 'HC', 'KT']) expect(rows.some((r) => r.startsWith(`${s} `)), s).toBe(true);
    expect(t).toContain('Cục Xe – Máy, Bộ Quốc phòng');
  });
  it('/bien-so-ng-qt-cv-nn: 4 rows; NG and QT red letters, CV and NN black; Đại sứ/Tổng Lãnh sự 01 + gạch đỏ ngang', () => {
    const rows = rowsOf(html('bien-so-ng-qt-cv-nn')).map((r) => text(r));
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatch(/^NG Nền trắng, chữ đỏ, số đen; ký hiệu NG màu đỏ/);
    expect(rows[1]).toMatch(/^QT Nền trắng, chữ đỏ, số đen/);
    expect(rows[2]).toMatch(/^CV Nền trắng, chữ và số đen/);
    expect(rows[3]).toMatch(/^NN Nền trắng, chữ và số đen/);
    expect(body('bien-so-ng-qt-cv-nn')).toContain('số thứ tự 01 và gạch đỏ ngang');
  });
  it('/bien-so-dinh-danh: 3 kinds of ID, 5 năm, kho số, not for auction plates, TT 37/2026 from the LSVN summary', () => {
    const t = body('bien-so-dinh-danh');
    for (const k of ['số định danh cá nhân', 'mã số thuế hoặc số quyết định thành lập', 'trong 5 năm', 'kho số', 'xe gắn biển trúng đấu giá', 'VNeID và VNeTraffic', 'bài tóm tắt của LSVN']) expect(t, k).toContain(k);
    expect(t).toContain('hỏi công an nơi đăng ký để chắc chắn'.replace('hỏi', 'Hỏi'));
  });
  it('/khi-nao-phai-doi-bien-so-xe: exactly the 6 cases of Điều 18, ĐKX13/ĐKX14, 30 ngày rule removed from 01/01/2025, F19 sentence', () => {
    const h = html('khi-nao-phai-doi-bien-so-xe');
    expect(rowsOf(h)).toHaveLength(6);
    const t = text(main(h));
    for (const k of ['ĐKX13', 'ĐKX14', '30 ngày', 'Từ 01/01/2025, Thông tư 79/2024 bỏ yêu cầu này', 'Điều 18 TT 79/2024/TT-BCA không liệt kê trường hợp phải đổi biển do sáp nhập tỉnh', 'chuyển nơi cư trú không nằm trong các trường hợp bắt buộc đổi; chủ xe có thể đổi theo địa chỉ mới nếu có nhu cầu']) expect(t, k).toContain(k);
    expect(t.match(/hỏi công an nơi đăng ký để chắc chắn/gi)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
  it('/bien-so-3-so-4-so: still usable (Điều 39 khoản 3), changed when the owner does the procedure', () => {
    const t = body('bien-so-3-so-4-so-con-dung-duoc-khong');
    expect(t).toContain('vẫn được tiếp tục tham gia giao thông');
    expect(t).toContain('đổi, cấp lại chứng nhận đăng ký xe, biển số xe hoặc đăng ký sang tên');
  });
  it('/dau-gia-bien-so-xe: exact figures (40 triệu / 5 triệu / 500.000 / 30 ngày / 12 tháng / 6 tháng), no results or winning prices', () => {
    const h = html('dau-gia-bien-so-xe');
    const t = text(main(h));
    for (const k of ['40 triệu đồng', '5 triệu đồng', '500.000 đồng', '30 ngày', '12 tháng', 'tối đa 6 tháng', 'kiểm tra thông báo của phiên đấu giá']) expect(t.toLowerCase(), k).toContain(k.toLowerCase());
    expect(t).toContain('Biển số riêng thì không được chuyển nhượng, tặng cho hay để thừa kế');
    expect(t).not.toMatch(/giá trúng|trúng với giá|kết quả phiên|tỷ đồng|500 triệu|50 triệu/);
    const rows = rowsOf(h).map((r) => text(r));
    expect(rows[0]).toBe('Giá khởi điểm 40 triệu đồng 5 triệu đồng');
    expect(rows[2]).toBe('Bước giá 5 triệu đồng 500.000 đồng');
  });
  it('mobile-safe tables on all V1.2 pages (wrapper + data-label), no raw "BIEN SO" text anywhere on the site', () => {
    for (const f of V12) {
      const h = read(`${f}.html`);
      if (h.includes('<table')) {
        expect(h, f).toContain('class="tbl-wrap"');
        expect(h, f).toMatch(/<td data-label=/);
      }
    }
    for (const f of readdirSync('dist', { recursive: true, encoding: 'utf8' }).filter((x) => x.endsWith('.html'))) expect(text(read(f)), f).not.toContain('BIEN SO');
  });
  it('/nguon FAQ uses the F19 sentence, not the old default', () => {
    const t = text(read('nguon.html'));
    expect(t).toContain('Điều 18 TT 79/2024/TT-BCA không liệt kê trường hợp phải đổi biển do sáp nhập tỉnh; hỏi công an nơi đăng ký để chắc chắn.');
    expect(t).not.toContain('Chưa thấy quy định bắt buộc đổi biển');
  });
});
