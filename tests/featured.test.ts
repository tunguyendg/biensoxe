import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import configFile from '../data/featured.config.json';
import linksFile from '../data/featured.json';
import {
  HIDE_EXPIRED_SCRIPT, IMAGE_MAX_BYTES, activeFeatured, isShopeeTarget, validateFeaturedConfig, validateFeaturedLinks,
  type FeaturedConfigItem, type FeaturedLink,
} from '../src/lib/featured';

const NOW = new Date('2026-11-11T12:00:00+07:00');
const item = (id: string, over: Partial<FeaturedConfigItem> = {}): FeaturedConfigItem => ({
  id, title: 'Camera hành trình', subtitle: 'Ghi lại hình ảnh trên đường đi.', targetUrl: 'https://shopee.vn/product/1/2', active: true, ...over,
});
const link = (id: string, over: Partial<FeaturedLink> = {}): FeaturedLink => ({
  id, affLink: `https://go.isclix.com/deep_link/x/y?sub1=featured&sub2=${id}`, generatedAt: 'g', checkedAt: 'c', status: 'ok', ...over,
});

describe('shipped data', () => {
  it('sample config: 1 item, inactive, url TODO, ends 2026-11-12 (+07:00); featured.json is []', () => {
    expect(configFile).toHaveLength(1);
    expect(configFile[0]).toMatchObject({ id: 'sieu-sale-11-11', title: 'Siêu sale 11.11', targetUrl: 'TODO', endAt: '2026-11-12T00:00:00+07:00', active: false });
    expect(() => validateFeaturedConfig(configFile as FeaturedConfigItem[])).not.toThrow();
    expect(linksFile).toEqual([]);
  });
  it('images in public/featured are webp ≤ 60 KB', () => {
    for (const f of readdirSync('public/featured').filter((n) => n !== '.gitkeep')) {
      expect(f).toMatch(/\.webp$/);
      expect(statSync(join('public/featured', f)).size).toBeLessThanOrEqual(IMAGE_MAX_BYTES);
    }
  });
});

describe('validateFeaturedConfig (build gate)', () => {
  const bad = (over: Partial<FeaturedConfigItem>, re: RegExp) => expect(() => validateFeaturedConfig([item('a', over)])).toThrow(re);

  it('accepts a normal active item and inactive placeholders', () => {
    expect(() => validateFeaturedConfig([item('a'), item('b', { active: false, targetUrl: 'TODO' })])).not.toThrow();
    expect(() => validateFeaturedConfig([])).not.toThrow();
  });
  it('fails with more than 2 active items', () => {
    expect(() => validateFeaturedConfig([item('a'), item('b'), item('c')])).toThrow(/3 active/);
    expect(() => validateFeaturedConfig([item('a'), item('b'), item('c', { active: false })])).not.toThrow();
  });
  it('fails when an active targetUrl is not https://shopee.vn or shp.ee', () => {
    for (const u of ['TODO', 'http://shopee.vn/x', 'https://evil.com/shopee.vn', 'https://shopee.vn.evil.com/x', 'https://lazada.vn/x', 'not a url', 'https://go.isclix.com/x']) bad({ targetUrl: u }, /targetUrl/);
    for (const u of ['https://shopee.vn/', 'https://shopee.vn/product/1/2', 'https://shp.ee/abc123', 'https://s.shopee.vn/x']) expect(isShopeeTarget(u), u).toBe(true);
    expect(isShopeeTarget('https://shopee.com/x')).toBe(false);
  });
  it('promo wording (%, giảm, đ, k, free ship, voucher) is only allowed with an endAt', () => {
    const END = '2026-11-12T00:00:00+07:00';
    for (const text of ['Giảm sâu hôm nay', 'Sale 50%', 'Chỉ từ 99k', 'Từ 99.000đ', '99 đ', 'Free ship toàn quốc', 'Freeship', 'Nhận voucher', 'Mua 5 k', 'Giá chỉ 50K']) {
      bad({ title: text }, /endAt/);
      bad({ subtitle: text }, /endAt/);
      expect(() => validateFeaturedConfig([item('a', { title: text, endAt: END })]), text).not.toThrow();
    }
    // ordinary Vietnamese words containing k/đ must NOT trigger it
    for (const text of ['Điện thoại', 'Đồ chơi xe máy', 'Camera đa góc', 'Kính chiếu hậu', 'Khóa chống trộm']) {
      expect(() => validateFeaturedConfig([item('a', { title: text })]), text).not.toThrow();
    }
  });
  it('enforces id, length, date and image rules', () => {
    bad({ id: 'Bad Id' }, /bad id/);
    expect(() => validateFeaturedConfig([item('a'), item('a', { active: false })])).toThrow(/duplicate/);
    bad({ title: '' }, /title/);
    bad({ title: 'x'.repeat(51) }, /title/);
    expect(() => validateFeaturedConfig([item('a', { title: 'x'.repeat(50) })])).not.toThrow();
    bad({ subtitle: '' }, /subtitle/);
    bad({ subtitle: 'x'.repeat(81) }, /subtitle/);
    expect(() => validateFeaturedConfig([item('a', { subtitle: 'x'.repeat(80) })])).not.toThrow();
    bad({ startAt: '2026-11-11' }, /startAt/);
    bad({ endAt: '2026-11-12T00:00:00' }, /endAt/); // no offset
    bad({ endAt: '2026-13-45T00:00:00+07:00' }, /endAt/);
    bad({ startAt: '2026-11-12T00:00:00+07:00', endAt: '2026-11-11T00:00:00+07:00' }, /before/);
    bad({ image: 'https://x/a.png' }, /image/);
    bad({ image: '/featured/a.png' }, /image/);
    expect(() => validateFeaturedConfig([item('a', { image: '/featured/a.webp', startAt: '2026-11-11T00:00:00+07:00', endAt: '2026-11-12T00:00:00Z' })])).not.toThrow();
  });
  it('validateFeaturedLinks: stored links must be https', () => {
    expect(() => validateFeaturedLinks([link('a', { affLink: 'TODO' })])).toThrow(/https/);
    expect(() => validateFeaturedLinks([link('a')])).not.toThrow();
  });
});

describe('activeFeatured (build-time filter)', () => {
  const win = { startAt: '2026-11-11T00:00:00+07:00', endAt: '2026-11-12T00:00:00+07:00' };
  const ids = (cfg: FeaturedConfigItem[], links: FeaturedLink[], now = NOW) => activeFeatured(cfg, links, now).map((x) => x.item.id);

  it('shows an active, ok item inside its window, with its aff link', () => {
    const r = activeFeatured([item('a', win)], [link('a')], NOW);
    expect(r).toHaveLength(1);
    expect(r[0]?.href).toContain('sub1=featured');
  });
  it('time window: before startAt, at/after endAt → hidden; startAt is inclusive, endAt exclusive', () => {
    const c = [item('a', win)];
    const l = [link('a')];
    expect(ids(c, l, new Date('2026-11-10T23:59:59+07:00'))).toEqual([]);
    expect(ids(c, l, new Date('2026-11-11T00:00:00+07:00'))).toEqual(['a']);
    expect(ids(c, l, new Date('2026-11-11T23:59:59+07:00'))).toEqual(['a']);
    expect(ids(c, l, new Date('2026-11-12T00:00:00+07:00'))).toEqual([]);
    expect(ids(c, l, new Date('2027-01-01T00:00:00+07:00'))).toEqual([]);
  });
  it('open-ended items (no startAt / endAt) are always in window', () => {
    expect(ids([item('a')], [link('a')], new Date('2030-01-01T00:00:00Z'))).toEqual(['a']);
    expect(ids([item('a', { endAt: '2026-12-01T00:00:00+07:00' })], [link('a')])).toEqual(['a']);
    expect(ids([item('a', { startAt: '2026-11-01T00:00:00+07:00' })], [link('a')])).toEqual(['a']);
  });
  it('inactive, status ≠ ok, missing or non-https links never show', () => {
    expect(ids([item('a', { active: false })], [link('a')])).toEqual([]);
    expect(ids([item('a')], [link('a', { status: 'failed' })])).toEqual([]);
    expect(ids([item('a')], [link('a', { status: 'unchecked' })])).toEqual([]);
    expect(ids([item('a')], [])).toEqual([]);
    expect(ids([item('a')], [link('a', { affLink: 'http://x' })])).toEqual([]);
  });
  it('never more than 2, in config order', () => {
    expect(ids([item('a'), item('b'), item('c')], [link('a'), link('b'), link('c')])).toEqual(['a', 'b']); // (the build gate would reject 3 active anyway)
  });
});

describe('expiry script', () => {
  it('is ≤ 300 bytes', () => {
    expect(Buffer.byteLength(HIDE_EXPIRED_SCRIPT)).toBeLessThanOrEqual(300);
  });
  it('is only used by the component (no featured code in the lookup bundle)', () => {
    const src = readFileSync('src/scripts/search.ts', 'utf8') + readFileSync('src/scripts/share.ts', 'utf8');
    expect(src).not.toMatch(/featured/i);
  });
});
