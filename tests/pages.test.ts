import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LIMITS } from '../src/lib/copy';
import { data } from '../src/lib/data';
import { FAQ } from '../src/lib/faq';
import { breadcrumbNode, faqNode, ldString } from '../src/lib/jsonld';
import { lookup } from '../src/lib/lookup';
import { DESC_MAX, DESC_MIN, TITLE_MAX, codeDescription, codeExplanation, codeTitle, fitText, mergerSentence, provinceDescription, provinceTitle } from '../src/lib/pages';
import { foldText, joinVi } from '../src/lib/format';
import { assertStrictBuild } from '../src/lib/strict';
import type { AuditGate } from '../src/lib/audit-gate';
const OK: AuditGate = { currentSha: 'x', audit: { dataSha256: 'x', mismatches: 0, coverageIssues: 0 } };


const found = (c: string) => lookup(c) as Extract<ReturnType<typeof lookup>, { kind: 'province' | 'special' }>;

describe('titles & copy', () => {
  it('title patterns from the brief', () => {
    expect(codeTitle(found('83'))).toBe('Biển số 83 là tỉnh nào? Cần Thơ (trước là Sóc Trăng)');
    expect(codeTitle(found('27'))).toBe('Biển số 27 là tỉnh nào? Điện Biên');
    expect(codeTitle(found('65'))).toBe('Biển số 65 là tỉnh nào? Cần Thơ'); // name unchanged
    expect(codeTitle(found('80'))).toContain('Biển số 80: Cục Cảnh sát giao thông');
    expect(provinceTitle(data.provinces[0] as never)).toContain('Hà Nội');
  });
  it('descriptions and explanations use only data-derived facts and never promise re-plating rules', () => {
    expect(codeDescription(found('83'))).toContain('trước 01/07/2025 là Sóc Trăng');
    expect(codeDescription(found('27'))).not.toContain('trước');
    expect(codeDescription(found('80'))).toContain('không gắn với tỉnh');
    expect(codeExplanation(found('83'))).toContain('Sóc Trăng được hợp nhất vào Cần Thơ theo Nghị quyết 202/2025/QH15.');
    expect(codeExplanation(found('52'))).toBe('Biển 52 là xe đăng ký tại TP. Hồ Chí Minh. Mã 52 vẫn thuộc TP. Hồ Chí Minh như trước 01/07/2025.');
    expect(codeExplanation(found('65'))).toContain('Mã 65 vẫn thuộc Cần Thơ như trước 01/07/2025.');
    expect(codeExplanation(found('83'))).not.toContain('thuộc diện');
    expect(codeExplanation(found('27'))).toContain('không thuộc diện sắp xếp');
    expect(codeExplanation(found('80'))).toContain('Cục Cảnh sát giao thông');
    for (const c of data.codes) expect(codeExplanation(found(c.code))).not.toMatch(/không phải đổi/i);
  });
  it('mergerSentence for merged and unchanged provinces', () => {
    const p = (slug: string) => data.provinces.find((x) => x.slug === slug) as never;
    expect(mergerSentence(p('can-tho'))).toBe('Từ 01/07/2025, Cần Thơ, Sóc Trăng và Hậu Giang hợp nhất thành Cần Thơ theo Nghị quyết 202/2025/QH15.');
    expect(mergerSentence(p('ha-noi'))).toContain('không thuộc diện sắp xếp');
  });
  it('helpers', () => {
    expect(joinVi([])).toBe('');
    expect(joinVi(['A'])).toBe('A');
    expect(joinVi(['A', 'B'])).toBe('A và B');
    expect(joinVi(['A', 'B', 'C'])).toBe('A, B và C');
    expect(foldText('  Đà Nẵng ')).toBe('da nang');
  });
  it('the limits sentence is the exact approved text and lives in ONE place', () => {
    expect(LIMITS).toBe('Mã biển chỉ cho biết nơi cấp biển. Không cho biết chủ xe là ai, đang sống ở đâu hay tình trạng của xe.');
    const hits: string[] = [];
    for (const f of readdirSync('src', { recursive: true, encoding: 'utf8' })) {
      if (!/\.(ts|astro)$/.test(f)) continue;
      if (readFileSync(join('src', f), 'utf8').includes('chỉ cho biết nơi cấp biển')) hits.push(f);
    }
    expect(hits).toEqual(['lib/copy.ts']);
  });
});

describe('title / description fitting', () => {
  it('fitText adds optional sentences only while they fit and until the minimum is reached', () => {
    expect(fitText('a'.repeat(130), ['b'])).toBe('a'.repeat(130)); // already ≥ min: untouched
    expect(fitText('a'.repeat(100), ['b'.repeat(30), 'c'.repeat(10)])).toBe(`${'a'.repeat(100)} ${'b'.repeat(30)}`);
    expect(fitText('a'.repeat(100), ['b'.repeat(80), 'c'.repeat(10)])).toBe(`${'a'.repeat(100)} ${'c'.repeat(10)}`); // too long one skipped
  });
  it('every code and province title is ≤ 60 chars and every description is 120–160 chars', () => {
    for (const c of data.codes) {
      const r = found(c.code);
      expect(codeTitle(r).length, c.code).toBeLessThanOrEqual(TITLE_MAX);
      expect(codeDescription(r).length, c.code).toBeGreaterThanOrEqual(DESC_MIN);
      expect(codeDescription(r).length, c.code).toBeLessThanOrEqual(DESC_MAX);
    }
    for (const p of data.provinces) {
      expect(provinceTitle(p).length, p.slug).toBeLessThanOrEqual(TITLE_MAX);
      expect(provinceDescription(p).length, p.slug).toBeGreaterThanOrEqual(DESC_MIN);
      expect(provinceDescription(p).length, p.slug).toBeLessThanOrEqual(DESC_MAX);
    }
  });
  it('long names fall back to a shorter title that still names code and province', () => {
    expect(codeTitle(found('72'))).toBe('Biển số 72 là TP. Hồ Chí Minh (trước là Bà Rịa – Vũng Tàu)');
    expect(provinceTitle(data.provinces.find((p) => p.slug === 'ho-chi-minh') as never)).toBe('Biển số xe TP. Hồ Chí Minh (13 mã biển)');
  });
});

describe('FAQ & JSON-LD', () => {
  it('4–6 questions, each with an answer and a SOURCES.md row', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(4);
    expect(FAQ.length).toBeLessThanOrEqual(6);
    for (const f of FAQ) for (const k of ['q', 'a', 'source'] as const) expect(f[k].trim()).not.toBe('');
  });
  it('never states the OPEN claim as fact (no "biển cũ không phải đổi")', () => {
    for (const f of FAQ) expect(f.a).not.toMatch(/không phải đổi/i);
    expect(FAQ.some((f) => f.a.includes('Điều 18 TT 79/2024/TT-BCA không liệt kê trường hợp phải đổi biển do sáp nhập tỉnh; hỏi công an nơi đăng ký để chắc chắn.'))).toBe(true);
    expect(FAQ.some((f) => f.a.includes('Chưa thấy quy định'))).toBe(false);
  });
  it('JSON-LD shapes and script-safe escaping', () => {
    const b = breadcrumbNode('https://x/b#breadcrumb', [{ name: 'A', url: 'https://x/' }, { name: 'B', url: 'https://x/b' }]);
    expect(b).toMatchObject({ '@type': 'BreadcrumbList', '@id': 'https://x/b#breadcrumb', itemListElement: [{ position: 1 }, { position: 2, item: 'https://x/b' }] });
    expect(faqNode('https://x/#faq', FAQ)).toMatchObject({ '@type': 'FAQPage', '@id': 'https://x/#faq' });
    expect(ldString({ a: '</script><b>' })).not.toContain('<');
  });
});

const asDraft = () => {
  const d = structuredClone(data);
  d.provinces.forEach((p) => (p.verified = false));
  d.codes.forEach((c) => (c.verified = false));
  return d;
};

describe('strict build also needs the real https SITE_URL', () => {
  const draftData = asDraft();
  const verified = structuredClone(data);
  verified.provinces.forEach((p) => (p.verified = true));
  verified.codes.forEach((c) => (c.verified = true));
  it('fails only for unverified records and/or SITE_URL, and says both when both apply', () => {
    expect(() => assertStrictBuild(draftData, '1', undefined, OK)).toThrow(/verified:false[\s\S]*SITE_URL/);
    expect(() => assertStrictBuild(draftData, '1', 'https://x.example', OK)).toThrow(/verified:false/);
    expect(() => assertStrictBuild(draftData, '1', 'https://x.example', OK)).not.toThrow(/SITE_URL/);
  });
  it('fails without https SITE_URL, passes with it', () => {
    expect(() => assertStrictBuild(verified, '1', undefined, OK)).toThrow(/SITE_URL/);
    expect(() => assertStrictBuild(verified, '1', 'http://x.test', OK)).toThrow(/SITE_URL/);
    expect(() => assertStrictBuild(verified, '1', 'https://bienso.example', OK)).not.toThrow();
    expect(() => assertStrictBuild(verified, undefined, undefined, OK)).not.toThrow();
  });
});

describe('analytics snippet', () => {
  it('no token (or blank) → no script; token → Cloudflare beacon only', async () => {
    const { analyticsScript } = await import('../src/lib/analytics');
    expect(analyticsScript(undefined)).toBeNull();
    expect(analyticsScript('  ')).toBeNull();
    expect(analyticsScript(' abc123 ')).toEqual({ src: 'https://static.cloudflareinsights.com/beacon.min.js', beacon: '{"token":"abc123"}' });
  });
});

describe('strict build also needs a fresh, clean data audit', () => {
  const verified = structuredClone(data);
  verified.provinces.forEach((p) => (p.verified = true));
  verified.codes.forEach((c) => (c.verified = true));
  const SITE = 'https://bienso.example';
  const gate = (a: Partial<NonNullable<AuditGate['audit']>> | null): AuditGate => ({
    currentSha: 'abc',
    audit: a === null ? null : { dataSha256: 'abc', mismatches: 0, coverageIssues: 0, ...a },
  });
  it('passes only with a matching sha and 0 MISMATCH / 0 coverage issues', () => {
    expect(() => assertStrictBuild(verified, '1', SITE, gate({}))).not.toThrow();
  });
  it('fails when the audit file is missing', () => {
    expect(() => assertStrictBuild(verified, '1', SITE, gate(null))).toThrow(/audit-result\.json is missing/);
  });
  it('fails when plate-codes.json changed after the audit (sha differs)', () => {
    expect(() => assertStrictBuild(verified, '1', SITE, gate({ dataSha256: 'old' }))).toThrow(/stale/);
  });
  it('fails on MISMATCH or coverage issues', () => {
    expect(() => assertStrictBuild(verified, '1', SITE, gate({ mismatches: 1 }))).toThrow(/1 MISMATCH/);
    expect(() => assertStrictBuild(verified, '1', SITE, gate({ coverageIssues: 2 }))).toThrow(/2 coverage/);
  });
  it('lists every reason together and is a no-op without the strict flag', () => {
    expect(() => assertStrictBuild(asDraft(), '1', undefined, gate(null))).toThrow(/verified:false[\s\S]*SITE_URL[\s\S]*audit-result/);
    expect(() => assertStrictBuild(data, undefined, undefined, gate(null))).not.toThrow();
  });
  it('summariseAudit reads sha, MISMATCH count and coverage; malformed counts as an issue', async () => {
    const { summariseAudit, readAuditGate } = await import('../src/lib/audit-gate');
    expect(summariseAudit({ summary: { dataSha256: 'h', coverage: [] }, results: [{ verdict: 'MATCH' }, { verdict: 'MISMATCH' }] })).toEqual({ dataSha256: 'h', mismatches: 1, coverageIssues: 0 });
    expect(summariseAudit({}).coverageIssues).toBeGreaterThan(0);
    const real = readAuditGate('.');
    expect(real.audit?.dataSha256).toBe(real.currentSha); // committed audit is fresh
    expect(real.audit?.mismatches).toBe(0);
  });
});

describe('appendixNameNote (decision-driven, name from data/sources)', async () => {
  const { appendixNameNote } = await import('../src/lib/decisions');
  const units = [{ name: 'Thừa Thiên Huế', codes: ['75'] }, { name: 'Cần Thơ', codes: ['65', '83'] }];
  it('shows the appendix name only when a decision exists and the names differ', () => {
    expect(appendixNameNote('code:75', 'Huế', ['75'], { 'code:75': 'x' }, units)).toBe("Phụ lục 02 TT 51/2025/TT-BCA ghi tên địa phương là 'Thừa Thiên Huế'.");
    expect(appendixNameNote('province:hue', 'Huế', ['75'], { 'province:hue': 'x' }, units)).toContain('Thừa Thiên Huế');
    expect(appendixNameNote('code:75', 'Huế', ['75'], {}, units)).toBeNull(); // no decision
    expect(appendixNameNote('code:83', 'Cần Thơ', ['83'], { 'code:83': 'x' }, units)).toBeNull(); // same name
    expect(appendixNameNote('code:99', 'X', ['99'], { 'code:99': 'x' }, units)).toBeNull(); // not in appendix
  });
  it('real data: the appendix name for code 75 is read from the source file', () => {
    expect(appendixNameNote('code:75', 'Huế', ['75'], { 'code:75': 'x' })).toContain('Thừa Thiên Huế');
  });
});

describe('article dates', async () => {
  const { articleDates, ARTICLE_SAPNHAP, ARTICLES, articlesByDate } = await import('../src/lib/knowledge');
  const { articleNode } = await import('../src/lib/schema');
  const site = new URL('https://bienso.org');
  it('datePublished = publishedAt; dateModified = max(publishedAt, lastReviewed); "Cập nhật" only when different', () => {
    expect(ARTICLE_SAPNHAP.publishedAt).toBe('2026-11-09');
    expect(articleDates(ARTICLE_SAPNHAP, '2026-11-08')).toEqual({ published: '2026-11-09', modified: '2026-11-09', showModified: false });
    expect(articleDates(ARTICLE_SAPNHAP, '2026-11-09').showModified).toBe(false);
    expect(articleDates(ARTICLE_SAPNHAP, '2026-12-01')).toEqual({ published: '2026-11-09', modified: '2026-12-01', showModified: true });
    const node = (lastReviewed: string) => {
      const d = articleDates(ARTICLE_SAPNHAP, lastReviewed);
      return articleNode({ path: ARTICLE_SAPNHAP.path, h1: ARTICLE_SAPNHAP.h1, description: ARTICLE_SAPNHAP.description, published: d.published, modified: d.modified }, site);
    };
    expect(node('2026-12-01')).toMatchObject({ datePublished: '2026-11-09', dateModified: '2026-12-01' });
    expect(node('2026-11-08').dateModified).toBe('2026-11-09');
  });
  it('articlesByDate: newest first, same-day articles keep their declared order', () => {
    const [a, b, c] = ARTICLES as [typeof ARTICLES[number], typeof ARTICLES[number], typeof ARTICLES[number]];
    const x = { ...a, publishedAt: '2026-01-01' };
    const y = { ...b, publishedAt: '2026-03-01' };
    const z = { ...c, publishedAt: '2026-03-01' };
    expect(articlesByDate([x, y, z])).toEqual([y, z, x]);
  });
});
