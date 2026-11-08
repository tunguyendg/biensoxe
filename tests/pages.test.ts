import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LIMITS } from '../src/lib/copy';
import { data } from '../src/lib/data';
import { FAQ } from '../src/lib/faq';
import { breadcrumbLd, faqLd, ldString } from '../src/lib/jsonld';
import { lookup } from '../src/lib/lookup';
import { codeDescription, codeExplanation, codeTitle, mergerSentence, provinceTitle } from '../src/lib/pages';
import { foldText, joinVi } from '../src/lib/format';
import { assertStrictBuild } from '../src/lib/strict';

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
    expect(codeExplanation(found('83'))).toContain('Cần Thơ, Sóc Trăng và Hậu Giang hợp nhất thành Cần Thơ');
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

describe('FAQ & JSON-LD', () => {
  it('4–6 questions, each with an answer and a SOURCES.md row', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(4);
    expect(FAQ.length).toBeLessThanOrEqual(6);
    for (const f of FAQ) for (const k of ['q', 'a', 'source'] as const) expect(f[k].trim()).not.toBe('');
  });
  it('never states the OPEN claim as fact (no "biển cũ không phải đổi")', () => {
    for (const f of FAQ) expect(f.a).not.toMatch(/không phải đổi/i);
    expect(FAQ.some((f) => f.a.includes('Chưa thấy quy định bắt buộc đổi biển; hỏi công an nơi đăng ký để chắc chắn.'))).toBe(true);
  });
  it('JSON-LD shapes and script-safe escaping', () => {
    const b = breadcrumbLd([{ name: 'A', url: 'https://x/' }, { name: 'B', url: 'https://x/b' }]);
    expect(b).toMatchObject({ '@type': 'BreadcrumbList', itemListElement: [{ position: 1 }, { position: 2, item: 'https://x/b' }] });
    expect(faqLd(FAQ)).toMatchObject({ '@type': 'FAQPage' });
    expect(ldString({ a: '</script><b>' })).not.toContain('<');
  });
});

describe('strict build also needs the real https SITE_URL', () => {
  const verified = structuredClone(data);
  verified.provinces.forEach((p) => (p.verified = true));
  verified.codes.forEach((c) => (c.verified = true));
  it('fails only for unverified records and/or SITE_URL, and says both when both apply', () => {
    expect(() => assertStrictBuild(data, '1')).toThrow(/verified:false[\s\S]*SITE_URL/);
    expect(() => assertStrictBuild(data, '1', 'https://x.example')).toThrow(/verified:false/);
    expect(() => assertStrictBuild(data, '1', 'https://x.example')).not.toThrow(/SITE_URL/);
  });
  it('fails without https SITE_URL, passes with it', () => {
    expect(() => assertStrictBuild(verified, '1')).toThrow(/SITE_URL/);
    expect(() => assertStrictBuild(verified, '1', 'http://x.test')).toThrow(/SITE_URL/);
    expect(() => assertStrictBuild(verified, '1', 'https://bienso.example')).not.toThrow();
    expect(() => assertStrictBuild(verified, undefined)).not.toThrow();
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
