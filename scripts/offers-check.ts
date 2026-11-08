/**
 * Follow each affiliate link's redirects and confirm the final host is Shopee. No token needed.
 *   npm run offers:check      (re-run about every 2 weeks; build ignores offers older than 30 days)
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { FeaturedLink } from '../src/lib/featured';
import { PLACEMENTS, type Offer } from '../src/lib/offers';

export const MAX_HOPS = 10;
export const TIMEOUT_MS = 15_000;

export interface CheckDeps {
  fetch: typeof fetch;
  now: () => Date;
}

/** shopee.vn and its subdomains (incl. app / universal-link pages) and Shopee's shp.ee short domain. */
export function isShopeeHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'shopee.vn' || h.endsWith('.shopee.vn') || h === 'shp.ee';
}

/** Redirect hidden in a tiny HTML page (meta refresh / location assignment), if any. */
function htmlRedirect(body: string): string | null {
  const meta = /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>\s]+)/i.exec(body);
  const js = /location(?:\.href)?\s*=\s*["']([^"']+)["']/i.exec(body) ?? /location\.(?:replace|assign)\(\s*["']([^"']+)["']/i.exec(body);
  return meta?.[1] ?? js?.[1] ?? null;
}

export async function resolveFinalHost(url: string, deps: CheckDeps): Promise<string | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const res = await deps.fetch(current, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bien-so-link-check)' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const loc = res.headers.get('location');
    let next: string | null = null;
    if (res.status >= 300 && res.status < 400 && loc) next = loc;
    else if (res.status === 200 && !isShopeeHost(new URL(current).hostname)) {
      next = htmlRedirect(await res.text());
    }
    if (next === null) return new URL(current).hostname;
    current = new URL(next, current).href;
  }
  return null; // too many redirects
}

export async function checkOffers(offers: Offer[], deps: CheckDeps, log?: (l: string) => void): Promise<Offer[]> {
  const checkedAt = deps.now().toISOString();
  const out: Offer[] = [];
  for (const o of offers) {
    let ok = true;
    for (const pl of PLACEMENTS) {
      try {
        const host = await resolveFinalHost(o.links[pl], deps);
        const good = host !== null && isShopeeHost(host);
        log?.(`${good ? 'ok  ' : 'FAIL'} ${pl.padEnd(6)} ${o.id} → ${host ?? 'too many redirects'}`);
        ok = ok && good;
      } catch (e) {
        log?.(`FAIL ${pl.padEnd(6)} ${o.id} → ${(e as Error).name}`);
        ok = false;
      }
    }
    out.push({ ...o, checkedAt, status: ok ? 'ok' : 'failed' });
  }
  return out;
}

export async function checkFeatured(links: FeaturedLink[], deps: CheckDeps, log?: (l: string) => void): Promise<FeaturedLink[]> {
  const checkedAt = deps.now().toISOString();
  const out: FeaturedLink[] = [];
  for (const l of links) {
    let ok = false;
    try {
      const host = await resolveFinalHost(l.affLink, deps);
      ok = host !== null && isShopeeHost(host);
      log?.(`${ok ? 'ok  ' : 'FAIL'} featured ${l.id} → ${host ?? 'too many redirects'}`);
    } catch (e) {
      log?.(`FAIL featured ${l.id} → ${(e as Error).name}`);
    }
    out.push({ ...l, checkedAt, status: ok ? 'ok' : 'failed' });
  }
  return out;
}

export async function main(o: { root?: string; fetchFn?: typeof fetch; log?: (l: string) => void } = {}): Promise<number> {
  const log = o.log ?? console.log;
  const root = o.root ?? '.';
  const target = `${root}/data/offers.json`;
  const featuredTarget = `${root}/data/featured.json`;
  const offers = JSON.parse(readFileSync(target, 'utf8')) as Offer[];
  const featured = existsSync(featuredTarget) ? (JSON.parse(readFileSync(featuredTarget, 'utf8')) as FeaturedLink[]) : [];
  if (offers.length === 0 && featured.length === 0) {
    log('data/offers.json is empty — run: npm run offers:links');
    return 0;
  }
  const deps = { fetch: o.fetchFn ?? fetch, now: () => new Date() };
  const result = await checkOffers(offers, deps, log);
  const featuredResult = await checkFeatured(featured, deps, log);
  writeFileSync(`${target}.tmp`, JSON.stringify(result, null, 2) + '\n');
  renameSync(`${target}.tmp`, target);
  if (featured.length > 0) {
    writeFileSync(`${featuredTarget}.tmp`, JSON.stringify(featuredResult, null, 2) + '\n');
    renameSync(`${featuredTarget}.tmp`, featuredTarget);
  }
  const failed = [...result, ...featuredResult].filter((x) => x.status !== 'ok');
  log(failed.length === 0 ? 'All offers and featured banners ok.' : `${failed.length} failed: ${failed.map((x) => x.id).join(', ')}`);
  return failed.length === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
