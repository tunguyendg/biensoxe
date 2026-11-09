import { describe, expect, it, vi } from 'vitest';
import { API_URL, CAMPAIGN_ID, buildOffers, searchUrl, type Deps } from '../scripts/offers-links';
import { validateOffers, type OfferConfigItem } from '../src/lib/offers';

const CONFIG: OfferConfigItem[] = [
  { id: 'camera-hanh-trinh', label: 'L', title: 'Camera hành trình', blurb: 'Ghi lại hình ảnh trên đường đi.', keyword: 'camera hành trình ô tô', active: true },
  { id: 'off', label: 'L', title: 'Off', blurb: 'Tắt.', keyword: 'tắt', active: false },
  { id: 'bom-lop-mini', label: 'L', title: 'Bơm lốp mini', blurb: 'Bơm thêm hơi khi lốp non.', keyword: 'bơm lốp ô tô mini', active: true },
];

const okBody = (urls: string[], sub1: string, sub2: string) => ({
  success_link: urls.map((u) => ({ url_origin: u, aff_link: `https://go.isclix.com/deep_link/pub/camp?url=${encodeURIComponent(u)}&sub4=oneatweb&sub5=pub-api&sub1=${sub1}&sub2=${sub2}`, short_link: 'https://short.example/x' })),
  error_link: [],
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function deps(handler: (body: Record<string, unknown>, n: number) => Response | Promise<Response>, token = 'SECRET-TOKEN-123') {
  const calls: { url: string; init: RequestInit; body: Record<string, unknown> }[] = [];
  const sleep = vi.fn((ms: number): Promise<void> => (ms >= 0 ? Promise.resolve() : Promise.reject(new Error("neg"))));
  const d: Deps = {
    token, sleep, now: () => new Date('2026-11-08T10:00:00Z'),
    fetch: (async (url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      calls.push({ url, init, body });
      return handler(body, calls.length);
    }) as unknown as typeof fetch,
  };
  return { d, calls, sleep };
}
const echo = (b: Record<string, unknown>) => json(okBody(b.urls as string[], b.sub1 as string, b.sub2 as string));

describe('buildOffers', () => {
  it('makes one link per active category × placement, with the right campaign, subs and url', async () => {
    const { d, calls } = deps(echo);
    const out = await buildOffers(CONFIG, d);
    expect(calls).toHaveLength(4); // 2 active × 2 placements
    expect(out.map((o) => o.id)).toEqual(['camera-hanh-trinh', 'bom-lop-mini']);
    for (const c of calls) {
      expect(c.url).toBe(API_URL);
      expect(c.body.campaign_id).toBe(CAMPAIGN_ID);
      expect(['result', 'tinh']).toContain(c.body.sub1);
      expect(['camera-hanh-trinh', 'bom-lop-mini']).toContain(c.body.sub2);
      expect(Object.keys(c.body).sort()).toEqual(['campaign_id', 'sub1', 'sub2', 'urls']); // no sub4/sub5/utm
      expect((c.body.urls as string[]).length).toBeLessThanOrEqual(10);
    }
    expect(calls[0]?.body.urls).toEqual([`https://shopee.vn/search?keyword=${encodeURIComponent('camera hành trình ô tô')}&sortBy=sales`]);
    const cam = out[0];
    expect(cam?.links.result).toContain('sub1=result');
    expect(cam?.links.tinh).toContain('sub1=tinh');
    expect(cam?.links.result).not.toContain('short.example'); // aff_link, never short_link
    expect(cam).toMatchObject({ status: 'unchecked', checkedAt: null, generatedAt: '2026-11-08T10:00:00.000Z', title: 'Camera hành trình', blurb: 'Ghi lại hình ảnh trên đường đi.' });
    expect(() => validateOffers(out)).not.toThrow();
  });

  it('sends the token only in the Authorization header, and never puts a plate/code in the body', async () => {
    const { d, calls } = deps(echo);
    await buildOffers(CONFIG, d);
    for (const c of calls) {
      expect((c.init.headers as Record<string, string>).Authorization).toBe('Token SECRET-TOKEN-123');
      expect(JSON.stringify(c.body)).not.toContain('SECRET-TOKEN-123');
      const rest = { sub1: c.body.sub1, sub2: c.body.sub2, urls: c.body.urls }; // all but the fixed campaign id
      expect(JSON.stringify(rest)).not.toMatch(/\d{2}[A-Z]?[-\s.]?\d{3}/);
    }
  });

  it('retries 429/5xx with exponential backoff, then succeeds', async () => {
    const { d, calls, sleep } = deps((b, n) => (n === 1 ? json({}, 429) : n === 2 ? json({}, 503) : echo(b)));
    await buildOffers([CONFIG[0] as OfferConfigItem], d);
    expect(calls).toHaveLength(4); // 2 failures + 1 success (result) + 1 (tinh)
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000]);
  });

  it('retries after a network error / timeout', async () => {
    const { d, calls } = deps((b, n) => {
      if (n === 1) throw new DOMException('t', 'TimeoutError');
      return echo(b);
    });
    await buildOffers([CONFIG[0] as OfferConfigItem], d);
    expect(calls.length).toBe(3);
  });

  it('gives up after 3 retries and throws (no partial result)', async () => {
    const { d, calls } = deps(() => json({}, 429));
    await expect(buildOffers(CONFIG, d)).rejects.toThrow(/Gave up.*429/);
    expect(calls).toHaveLength(4); // 1 + 3 retries
  });

  it('does not retry a 401/403 and never leaks the token in the error', async () => {
    const { d, calls } = deps(() => json({}, 401));
    const err = await buildOffers(CONFIG, d).catch((e: Error) => e);
    expect((err as Error).message).toMatch(/HTTP 401/);
    expect((err as Error).message).not.toContain('SECRET-TOKEN-123');
    expect(calls).toHaveLength(1);
  });

  it('fails on error_link, a missing/short success list, or a non-https aff_link', async () => {
    await expect(buildOffers(CONFIG, deps(() => json({ success_link: [], error_link: [{}] })).d)).rejects.toThrow(/0\/1/);
    await expect(buildOffers(CONFIG, deps(() => json({ success_link: [{ aff_link: 'http://x' }], error_link: [] })).d)).rejects.toThrow(/https/);
    await expect(buildOffers(CONFIG, deps(() => json({ success_link: [{}], error_link: [] })).d)).rejects.toThrow(/https/);
    await expect(buildOffers(CONFIG, deps(() => json({})).d)).rejects.toThrow(/0\/1/);
  });

  it('accepts a {data:{success_link}} wrapper and matches by index when url_origin is absent', async () => {
    const { d } = deps((b) => json({ data: { success_link: [{ aff_link: `https://go.isclix.com/x?sub1=${b.sub1}` }] } }));
    const out = await buildOffers([CONFIG[0] as OfferConfigItem], d);
    expect(out[0]?.links.tinh).toBe('https://go.isclix.com/x?sub1=tinh');
  });

  it('rejects an invalid config before any request', async () => {
    const { d, calls } = deps(echo);
    await expect(buildOffers([{ ...(CONFIG[0] as OfferConfigItem), blurb: 'Giảm giá sốc' }], d)).rejects.toThrow(/price/);
    expect(calls).toHaveLength(0);
  });

  it('no active category → empty list, no requests', async () => {
    const { d, calls } = deps(echo);
    expect(await buildOffers([CONFIG[1] as OfferConfigItem], d)).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('searchUrl encodes the keyword', () => {
    expect(searchUrl('a b&c')).toBe('https://shopee.vn/search?keyword=a%20b%26c&sortBy=sales');
  });
});
