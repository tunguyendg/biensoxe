import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { main as checkMain } from '../scripts/offers-check';
import { main as linksMain } from '../scripts/offers-links';

const CONFIG = [{ id: 'camera-hanh-trinh', title: 'Camera', blurb: 'Ghi lại hình ảnh.', keyword: 'camera', active: true }];
const OLD = '[{"id":"old","marker":"keep-me"}]\n';

function project(offersJson = OLD) {
  const root = mkdtempSync(join(tmpdir(), 'bienso-'));
  mkdirSync(join(root, 'data'));
  writeFileSync(join(root, 'data/offers.config.json'), JSON.stringify(CONFIG));
  writeFileSync(join(root, 'data/offers.json'), offersJson);
  return root;
}
const quiet = { log: () => {}, err: () => {}, sleep: async () => {} };
const read = (root: string) => readFileSync(join(root, 'data/offers.json'), 'utf8');

describe('offers:links main()', () => {
  it('missing token → clear error, exit ≠ 0, file untouched, no request', async () => {
    const root = project();
    const err = vi.fn();
    const fetchFn = vi.fn();
    const code = await linksMain({ root, env: {}, fetchFn: fetchFn as never, ...quiet, err });
    expect(code).toBe(1);
    expect(err.mock.calls[0]?.[0]).toContain('ACCESSTRADE_TOKEN is missing');
    expect(fetchFn).not.toHaveBeenCalled();
    expect(read(root)).toBe(OLD);
  });

  it('API failure → keeps the old offers.json, exit ≠ 0, no temp file, token not printed', async () => {
    const root = project();
    const err = vi.fn();
    const fetchFn = vi.fn(async () => new Response('{}', { status: 429 }));
    const code = await linksMain({ root, env: { ACCESSTRADE_TOKEN: 'TOK-xyz' }, fetchFn: fetchFn as never, ...quiet, err });
    expect(code).toBe(1);
    expect(read(root)).toBe(OLD);
    expect(existsSync(join(root, 'data/offers.json.tmp'))).toBe(false);
    expect(err.mock.calls.join(' ')).not.toContain('TOK-xyz');
    expect(fetchFn).toHaveBeenCalledTimes(4); // first request: 1 try + 3 retries, then abort
  });

  it('success → writes the new offers.json atomically', async () => {
    const root = project();
    const fetchFn = vi.fn(async (_u: string, init: RequestInit) => {
      const b = JSON.parse(init.body as string) as { urls: string[] };
      return new Response(JSON.stringify({ success_link: [{ aff_link: 'https://go.isclix.com/ok' }], error_link: [], urls: b.urls }));
    });
    const code = await linksMain({ root, env: { ACCESSTRADE_TOKEN: 't' }, fetchFn: fetchFn as never, ...quiet });
    expect(code).toBe(0);
    const out = JSON.parse(read(root)) as { id: string; status: string }[];
    expect(out).toMatchObject([{ id: 'camera-hanh-trinh', status: 'unchecked' }]);
    expect(existsSync(join(root, 'data/offers.json.tmp'))).toBe(false);
  });
});

describe('offers:check main()', () => {
  it('empty offers.json → message, exit 0', async () => {
    const root = project('[]');
    const log = vi.fn();
    expect(await checkMain({ root, log })).toBe(0);
    expect(log.mock.calls[0]?.[0]).toContain('empty');
    expect(read(root)).toBe('[]');
  });

  const offer = { id: 'a', title: 'A', blurb: 'b', links: { result: 'https://go.isclix.com/r', tinh: 'https://go.isclix.com/t' }, generatedAt: 'x', checkedAt: null, status: 'unchecked' };
  const redirectTo = (host: string) =>
    (async (url: string) => (new URL(url).hostname === 'go.isclix.com' ? new Response(null, { status: 302, headers: { location: `https://${host}/search?x=1` } }) : new Response('', { status: 200 }))) as never;

  it('shopee destination → status ok and checkedAt stamped, exit 0', async () => {
    const root = project(JSON.stringify([offer]));
    expect(await checkMain({ root, fetchFn: redirectTo('shopee.vn'), log: () => {} })).toBe(0);
    const [o] = JSON.parse(read(root)) as { status: string; checkedAt: string }[];
    expect(o?.status).toBe('ok');
    expect(Date.parse(o?.checkedAt as string)).not.toBeNaN();
  });

  it('non-shopee destination → failed, exit 1', async () => {
    const root = project(JSON.stringify([offer]));
    const log = vi.fn();
    expect(await checkMain({ root, fetchFn: redirectTo('evil.example'), log })).toBe(1);
    expect((JSON.parse(read(root)) as { status: string }[])[0]?.status).toBe('failed');
    expect(log.mock.calls.join('\n')).toContain('evil.example');
  });
});
