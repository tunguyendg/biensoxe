import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { main as checkMain, checkFeatured } from '../scripts/offers-check';
import { API_URL, CAMPAIGN_ID, buildFeatured, main as linksMain, type Deps } from '../scripts/offers-links';
import type { FeaturedConfigItem, FeaturedLink } from '../src/lib/featured';

const F: FeaturedConfigItem[] = [
  { id: 'sale-a', title: 'Siêu sale 11.11', subtitle: 'Chương trình có thời hạn.', targetUrl: 'https://shopee.vn/product/1/2', endAt: '2026-11-12T00:00:00+07:00', active: true },
  { id: 'off', title: 'Tắt', subtitle: 'Không chạy.', targetUrl: 'TODO', active: false },
  { id: 'shop-b', title: 'Shop B', subtitle: 'Gian hàng.', targetUrl: 'https://shp.ee/abc', active: true },
];
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
const ok = (b: Record<string, unknown>) => json({ success_link: [{ url_origin: (b.urls as string[])[0], aff_link: `https://go.isclix.com/deep_link/pub/camp?url=x&sub1=${b.sub1}&sub2=${b.sub2}` }], error_link: [] });

function deps(handler: (b: Record<string, unknown>, n: number) => Response) {
  const calls: Record<string, unknown>[] = [];
  const d: Deps = {
    token: 'SECRET-TOKEN-123', now: () => new Date('2026-11-08T10:00:00Z'), sleep: vi.fn((): Promise<void> => Promise.resolve()),
    fetch: (async (_u: string, init: RequestInit) => {
      const b = JSON.parse(init.body as string) as Record<string, unknown>;
      calls.push(b);
      return handler(b, calls.length);
    }) as unknown as typeof fetch,
  };
  return { d, calls };
}

describe('buildFeatured', () => {
  it('one aff_link per ACTIVE item, same campaign, sub1="featured", sub2=id, nothing else in the body', async () => {
    const { d, calls } = deps(ok);
    const out = await buildFeatured(F, d);
    expect(out.map((o) => o.id)).toEqual(['sale-a', 'shop-b']);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual({ campaign_id: CAMPAIGN_ID, urls: ['https://shopee.vn/product/1/2'], sub1: 'featured', sub2: 'sale-a' });
    expect(calls[1]).toMatchObject({ urls: ['https://shp.ee/abc'], sub1: 'featured', sub2: 'shop-b' });
    expect(out[0]).toMatchObject({ status: 'unchecked', checkedAt: null, generatedAt: '2026-11-08T10:00:00.000Z' });
    expect(out[0]?.affLink).toMatch(/^https:\/\/go\.isclix\.com\//);
    expect(API_URL).toContain('product_link/create');
  });
  it('retries on 429 and fails (throws) when the API keeps failing', async () => {
    const a = deps((b, n) => (n === 1 ? json({}, 429) : ok(b)));
    await buildFeatured([F[0] as FeaturedConfigItem], a.d);
    expect(a.calls).toHaveLength(2);
    const b = deps(() => json({}, 503));
    await expect(buildFeatured([F[0] as FeaturedConfigItem], b.d)).rejects.toThrow(/Gave up/);
  });
  it('rejects an invalid config before any request (non-shopee target, promo text without endAt, >2 active)', async () => {
    const { d, calls } = deps(ok);
    await expect(buildFeatured([{ ...(F[0] as FeaturedConfigItem), targetUrl: 'https://evil.com/x' }], d)).rejects.toThrow(/targetUrl/);
    const promo: FeaturedConfigItem = { id: 'p', title: 'Giảm sâu hôm nay', subtitle: 'Voucher free ship.', targetUrl: 'https://shopee.vn/x', active: true };
    await expect(buildFeatured([promo], d)).rejects.toThrow(/endAt/);
    await expect(buildFeatured([F[0], F[2], { ...(F[2] as FeaturedConfigItem), id: 'c' }] as FeaturedConfigItem[], d)).rejects.toThrow(/3 active/);
    expect(calls).toHaveLength(0);
  });
  it('no active item → empty list, no requests', async () => {
    const { d, calls } = deps(ok);
    expect(await buildFeatured([F[1] as FeaturedConfigItem], d)).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe('offers:links main() with featured', () => {
  const OFFERS_CFG = [{ id: 'camera-hanh-trinh', title: 'Camera', blurb: 'Ghi lại hình ảnh.', keyword: 'camera', active: true }];
  const OLD_O = '[{"id":"old-offer"}]\n';
  const OLD_F = '[{"id":"old-featured"}]\n';
  function project(withFeatured = true) {
    const root = mkdtempSync(join(tmpdir(), 'bienso-f-'));
    mkdirSync(join(root, 'data'));
    writeFileSync(join(root, 'data/offers.config.json'), JSON.stringify(OFFERS_CFG));
    writeFileSync(join(root, 'data/offers.json'), OLD_O);
    if (withFeatured) {
      writeFileSync(join(root, 'data/featured.config.json'), JSON.stringify(F));
      writeFileSync(join(root, 'data/featured.json'), OLD_F);
    }
    return root;
  }
  const quiet = { log: () => {}, err: () => {}, sleep: async () => {} };
  const rd = (root: string, f: string) => readFileSync(join(root, 'data', f), 'utf8');
  const apiOk = (async (_u: string, init: RequestInit) => ok(JSON.parse(init.body as string) as Record<string, unknown>)) as unknown as typeof fetch;

  it('success → writes both offers.json and featured.json', async () => {
    const root = project();
    expect(await linksMain({ root, env: { ACCESSTRADE_TOKEN: 't' }, fetchFn: apiOk, ...quiet })).toBe(0);
    expect(JSON.parse(rd(root, 'featured.json')) as FeaturedLink[]).toMatchObject([{ id: 'sale-a', status: 'unchecked' }, { id: 'shop-b' }]);
    expect(JSON.parse(rd(root, 'offers.json')) as { id: string }[]).toMatchObject([{ id: 'camera-hanh-trinh' }]);
    expect(existsSync(join(root, 'data/featured.json.tmp'))).toBe(false);
  });
  it('a featured failure keeps BOTH old files untouched, exit ≠ 0, token never printed', async () => {
    const root = project();
    const err = vi.fn();
    const fetchFn = vi.fn(async (_u: string, init: RequestInit) => {
      const b = JSON.parse(init.body as string) as Record<string, unknown>;
      return b.sub1 === 'featured' ? new Response('{}', { status: 401 }) : ok(b);
    });
    expect(await linksMain({ root, env: { ACCESSTRADE_TOKEN: 'TOK-xyz' }, fetchFn: fetchFn as never, ...quiet, err })).toBe(1);
    expect(rd(root, 'offers.json')).toBe(OLD_O);
    expect(rd(root, 'featured.json')).toBe(OLD_F);
    expect(err.mock.calls.join(' ')).toContain('featured.json');
    expect(err.mock.calls.join(' ')).not.toContain('TOK-xyz');
  });
  it('an invalid featured config (3 active) fails and leaves everything untouched', async () => {
    const root = project();
    writeFileSync(join(root, 'data/featured.config.json'), JSON.stringify([F[0], F[2], { ...F[2], id: 'c' }]));
    expect(await linksMain({ root, env: { ACCESSTRADE_TOKEN: 't' }, fetchFn: apiOk, ...quiet })).toBe(1);
    expect(rd(root, 'offers.json')).toBe(OLD_O);
    expect(rd(root, 'featured.json')).toBe(OLD_F);
  });
  it('without featured.config.json the featured file is not touched', async () => {
    const root = project(false);
    expect(await linksMain({ root, env: { ACCESSTRADE_TOKEN: 't' }, fetchFn: apiOk, ...quiet })).toBe(0);
    expect(existsSync(join(root, 'data/featured.json'))).toBe(false);
  });
});

describe('offers:check covers featured links', () => {
  const fl = (id: string, host: string): FeaturedLink => ({ id, affLink: `https://${host}/x`, generatedAt: 'g', checkedAt: null, status: 'unchecked' });
  const f = (async (url: string) => {
    const u = new URL(url);
    if (u.hostname === 'go.isclix.com') return new Response(null, { status: 302, headers: { location: 'https://shopee.vn/a' } });
    if (u.hostname === 'bad.isclix.com') return new Response(null, { status: 302, headers: { location: 'https://evil.example/a' } });
    return new Response('', { status: 200 });
  }) as unknown as typeof fetch;
  const now = () => new Date('2026-11-08T10:00:00Z');

  it('stamps checkedAt and ok/failed per banner (timeouts count as failed)', async () => {
    const lines: string[] = [];
    const boom = (async (url: string) => {
      if (url.includes('slow')) throw new DOMException('t', 'TimeoutError');
      return f(url);
    }) as unknown as typeof fetch;
    const out = await checkFeatured([fl('a', 'go.isclix.com'), fl('b', 'bad.isclix.com'), fl('c', 'slow.isclix.com')], { fetch: boom, now }, (l) => lines.push(l));
    expect(out.map((o) => o.status)).toEqual(['ok', 'failed', 'failed']);
    for (const o of out) expect(o.checkedAt).toBe('2026-11-08T10:00:00.000Z');
    expect(lines.join('\n')).toMatch(/FAIL featured c/);
  });
  it('a loop is reported as too many redirects', async () => {
    const loop = (async (u: string) => new Response(null, { status: 302, headers: { location: `${u}x` } })) as unknown as typeof fetch;
    const lines: string[] = [];
    const out = await checkFeatured([fl('a', 'go.isclix.com')], { fetch: loop, now }, (l) => lines.push(l));
    expect(out[0]?.status).toBe('failed');
    expect(lines[0]).toContain('too many redirects');
  });
  it('main(): checks offers AND featured, exit 1 if any fails; featured.json updated', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bienso-c-'));
    mkdirSync(join(root, 'data'));
    writeFileSync(join(root, 'data/offers.json'), '[]');
    writeFileSync(join(root, 'data/featured.json'), JSON.stringify([fl('a', 'go.isclix.com'), fl('b', 'bad.isclix.com')]));
    expect(await checkMain({ root, fetchFn: f, log: () => {} })).toBe(1);
    const out = JSON.parse(readFileSync(join(root, 'data/featured.json'), 'utf8')) as FeaturedLink[];
    expect(out.map((o) => o.status)).toEqual(['ok', 'failed']);
    writeFileSync(join(root, 'data/featured.json'), JSON.stringify([fl('a', 'go.isclix.com')]));
    expect(await checkMain({ root, fetchFn: f, log: () => {} })).toBe(0);
  });
});
