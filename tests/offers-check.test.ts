import { describe, expect, it } from 'vitest';
import { MAX_HOPS, checkOffers, isShopeeHost, resolveFinalHost } from '../scripts/offers-check';
import type { Offer } from '../src/lib/offers';

type Step = Response | Error;
const seq = (steps: Record<string, Step>) =>
  (async (url: string) => {
    const s = steps[url];
    if (s === undefined) throw new Error(`unexpected ${url}`);
    if (s instanceof Error) throw s;
    return s;
  }) as unknown as typeof fetch;
const redirect = (to: string, status = 302) => new Response(null, { status, headers: { location: to } });

describe('isShopeeHost', () => {
  it('accepts shopee.vn, its subdomains and shp.ee; rejects look-alikes', () => {
    for (const h of ['shopee.vn', 'SHOPEE.VN', 'app.shopee.vn', 'shp.ee']) expect(isShopeeHost(h), h).toBe(true);
    for (const h of ['evil-shopee.vn', 'shopee.vn.evil.com', 'shopee.com', 'go.isclix.com']) expect(isShopeeHost(h), h).toBe(false);
  });
});

describe('resolveFinalHost', () => {
  it('follows a chain of redirects (absolute and relative) to the final host', async () => {
    const f = seq({
      'https://go.isclix.com/a': redirect('https://t.example/b'),
      'https://t.example/b': redirect('/c', 301),
      'https://t.example/c': redirect('https://shopee.vn/search?keyword=x'),
      'https://shopee.vn/search?keyword=x': new Response('', { status: 200 }),
    });
    expect(await resolveFinalHost('https://go.isclix.com/a', { fetch: f, now: () => new Date() })).toBe('shopee.vn');
  });

  it('follows a meta-refresh / JS redirect page on a non-Shopee host', async () => {
    const f = seq({
      'https://go.isclix.com/m': new Response('<meta http-equiv="refresh" content="0; url=https://shopee.vn/x">', { status: 200 }),
      'https://shopee.vn/x': new Response('', { status: 200 }),
      'https://go.isclix.com/j': new Response('<script>window.location.href = "https://app.shopee.vn/y"</script>', { status: 200 }),
      'https://app.shopee.vn/y': new Response('', { status: 200 }),
      'https://go.isclix.com/r': new Response("<script>location.replace('https://shopee.vn/z')</script>", { status: 200 }),
      'https://shopee.vn/z': new Response('', { status: 200 }),
      'https://go.isclix.com/n': new Response('plain page', { status: 200 }),
    });
    const d = { fetch: f, now: () => new Date() };
    expect(await resolveFinalHost('https://go.isclix.com/m', d)).toBe('shopee.vn');
    expect(await resolveFinalHost('https://go.isclix.com/j', d)).toBe('app.shopee.vn');
    expect(await resolveFinalHost('https://go.isclix.com/r', d)).toBe('shopee.vn');
    expect(await resolveFinalHost('https://go.isclix.com/n', d)).toBe('go.isclix.com');
  });

  it('a Shopee page that answers 403 still counts (host is what we verify)', async () => {
    const f = seq({ 'https://shopee.vn/a': new Response('', { status: 403 }) });
    expect(await resolveFinalHost('https://shopee.vn/a', { fetch: f, now: () => new Date() })).toBe('shopee.vn');
  });

  it('gives up after more than 10 hops', async () => {
    const f = (async (u: string) => redirect(`${u}x`)) as unknown as typeof fetch;
    expect(MAX_HOPS).toBe(10);
    expect(await resolveFinalHost('https://a.example/', { fetch: f, now: () => new Date() })).toBeNull();
  });
});

describe('checkOffers', () => {
  const mk = (id: string): Offer => ({ id, title: id, blurb: 'b', links: { result: `https://go.isclix.com/${id}/r`, tinh: `https://go.isclix.com/${id}/t` }, generatedAt: 'g', checkedAt: null, status: 'unchecked' });
  const now = () => new Date('2026-11-08T10:00:00Z');

  it('ok only when both links end on Shopee; failures (timeout, too many hops, bad host) are reported', async () => {
    const f = seq({
      'https://go.isclix.com/good/r': redirect('https://shopee.vn/a'), 'https://shopee.vn/a': new Response(''),
      'https://go.isclix.com/good/t': redirect('https://shopee.vn/a'),
      'https://go.isclix.com/half/r': redirect('https://shopee.vn/a'),
      'https://go.isclix.com/half/t': redirect('https://other.example/'), 'https://other.example/': new Response(''),
      'https://go.isclix.com/slow/r': new DOMException('t', 'TimeoutError'),
      'https://go.isclix.com/slow/t': new DOMException('t', 'TimeoutError'),
    });
    const lines: string[] = [];
    const out = await checkOffers([mk('good'), mk('half'), mk('slow')], { fetch: f, now }, (l) => lines.push(l));
    expect(out.map((o) => o.status)).toEqual(['ok', 'failed', 'failed']);
    for (const o of out) expect(o.checkedAt).toBe('2026-11-08T10:00:00.000Z');
    expect(lines.join('\n')).toMatch(/FAIL.*slow/);
  });

  it('reports "too many redirects" for a loop', async () => {
    const f = (async (u: string) => redirect(`${u}x`)) as unknown as typeof fetch;
    const lines: string[] = [];
    const out = await checkOffers([mk('loop')], { fetch: f, now }, (l) => lines.push(l));
    expect(out[0]?.status).toBe('failed');
    expect(lines[0]).toContain('too many redirects');
  });
});
