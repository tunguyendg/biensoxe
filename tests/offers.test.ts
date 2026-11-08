import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, offers, selectOffers, validateOffers, type Offer } from '../src/lib/offers';

const o = (over: Partial<Offer>): Offer => ({
  id: 'x', title: 'Mũ bảo hiểm', description: 'd', url: 'https://example.com/a',
  placements: ['result', 'tinh', 'code'], active: true, ...over,
});

describe('shipped offers.json', () => {
  it('has the 4 sample offers, all inactive with url TODO (Founder fills in links)', () => {
    expect(offers.map((x) => x.id)).toEqual(['camera-hanh-trinh', 'bom-lop-mini', 'gia-do-dien-thoai-xe-may', 'bao-hiem-tnds']);
    for (const x of offers) expect([x.active, x.url]).toEqual([false, 'TODO']);
  });
  it('passes validation, and nothing renders while all are inactive', () => {
    expect(() => validateOffers(offers)).not.toThrow();
    for (const pl of ['result', 'tinh', 'code'] as const) expect(selectOffers(offers, pl)).toEqual([]);
  });
  it('images exist, are webp and ≤ 40 KB', () => {
    for (const x of offers) {
      if (!x.image) continue;
      const f = join('public', x.image);
      expect(existsSync(f), f).toBe(true);
      expect(statSync(f).size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    }
    for (const f of readdirSync('public/offers').filter((n) => n !== '.gitkeep')) {
      expect(f).toMatch(/\.webp$/);
      expect(statSync(join('public/offers', f)).size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    }
  });
});

describe('selectOffers', () => {
  it('never returns inactive or non-https offers (incl. "TODO")', () => {
    const list = [o({ id: 'a', active: false }), o({ id: 'b', url: 'TODO' }), o({ id: 'c', url: 'http://x.com' }), o({ id: 'd' })];
    expect(selectOffers(list, 'result').map((x) => x.id)).toEqual(['d']);
  });
  it('returns at most 2, in file order, filtered by placement', () => {
    const list = [o({ id: '1' }), o({ id: '2', placements: ['tinh'] }), o({ id: '3' }), o({ id: '4' })];
    expect(selectOffers(list, 'result').map((x) => x.id)).toEqual(['1', '3']);
    expect(selectOffers(list, 'tinh').map((x) => x.id)).toEqual(['1', '2']);
  });
});

describe('validateOffers (build gate)', () => {
  it('fails an active offer whose url is not https', () => {
    expect(() => validateOffers([o({ url: 'TODO' })])).toThrow(/https/);
    expect(() => validateOffers([o({ url: 'http://x.com' })])).toThrow(/https/);
  });
  it('allows inactive placeholders and https active offers', () => {
    expect(() => validateOffers([o({ active: false, url: 'TODO' }), o({ id: 'y' })])).not.toThrow();
  });
  it('rejects duplicate ids, unknown placements, bad image paths', () => {
    expect(() => validateOffers([o({}), o({})])).toThrow(/duplicate/);
    expect(() => validateOffers([o({ placements: ['nguon' as never] })])).toThrow(/placement/);
    expect(() => validateOffers([o({ image: 'https://cdn/x.png' })])).toThrow(/image/);
    expect(() => validateOffers([o({ image: '/offers/a.webp' })])).not.toThrow();
  });
  it('rejects license-plate frames / covers, even when inactive', () => {
    expect(() => validateOffers([o({ active: false, url: 'TODO', title: 'Khung biển số inox' })])).toThrow(/frames/);
    expect(() => validateOffers([o({ description: 'ốp biển số xe máy' })])).toThrow(/frames/);
  });
});

describe('placement rules', () => {
  const pagesDir = 'src/pages';
  const pages = readdirSync(pagesDir, { recursive: true, encoding: 'utf8' }).filter((f) => /\.(astro|ts)$/.test(f));

  it('/nguon and /404 never use OfferCards', () => {
    for (const f of pages.filter((p) => /(^|\/)(nguon|404)\b/.test(p))) {
      expect(readFileSync(join(pagesDir, f), 'utf8'), f).not.toMatch(/OfferCards/);
    }
  });
  it('OfferCards is only used with an allowed placement', () => {
    for (const f of pages) {
      const src = readFileSync(join(pagesDir, f), 'utf8');
      for (const m of src.matchAll(/<OfferCards[^>]*placement="([^"]+)"/g)) expect(['result', 'tinh', 'code']).toContain(m[1]);
    }
  });
});
