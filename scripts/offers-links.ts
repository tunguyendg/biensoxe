/**
 * Generate ACCESSTRADE affiliate links for the active categories in data/offers.config.json.
 * Runs on the Founder's machine only (needs ACCESSTRADE_TOKEN in .env) — never during the Cloudflare build.
 *   npm run offers:links
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { validateFeaturedConfig, type FeaturedConfigItem, type FeaturedLink } from '../src/lib/featured';
import {
  PLACEMENTS,
  validateConfig,
  type Offer,
  type OfferConfigItem,
  type Placement,
} from '../src/lib/offers';

export const CAMPAIGN_ID = '4751584435713464237'; // "Shopee Việt Nam Smartlink cho tất cả thiết bị"
export const API_URL = 'https://api.accesstrade.vn/v1/product_link/create';
export const BATCH_SIZE = 10;
export const TIMEOUT_MS = 15_000;
export const RETRIES = 3;

export interface Deps {
  fetch: typeof fetch;
  token: string;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  log?: (line: string) => void;
}

export function searchUrl(keyword: string): string {
  return `https://shopee.vn/search?keyword=${encodeURIComponent(keyword)}`;
}

interface Group {
  placement: Placement;
  id: string;
  urls: string[];
}

/** One request group per (placement, category): sub1 = placement, sub2 = category id. No sub4/sub5, no plate/code. */
async function postBatch(deps: Deps, sub1: string, sub2: string, urls: string[]): Promise<string[]> {
  let lastErr = 'unknown error';
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await deps.sleep(1000 * 2 ** (attempt - 1));
    let res: Response;
    try {
      res = await deps.fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: `Token ${deps.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: CAMPAIGN_ID, urls, sub1, sub2 }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      lastErr = `network/timeout: ${(e as Error).name}`;
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      lastErr = `HTTP ${res.status}`;
      continue;
    }
    if (!res.ok) throw new Error(`API rejected the request for ${sub1}/${sub2}: HTTP ${res.status}`);
    const json = (await res.json()) as {
      success_link?: { aff_link?: string; url_origin?: string }[];
      error_link?: unknown[];
      data?: { success_link?: { aff_link?: string; url_origin?: string }[]; error_link?: unknown[] };
    };
    const ok = json.success_link ?? json.data?.success_link ?? [];
    const bad = json.error_link ?? json.data?.error_link ?? [];
    if (bad.length > 0 || ok.length !== urls.length) {
      throw new Error(`API returned ${ok.length}/${urls.length} links for ${sub1}/${sub2} (${bad.length} errors)`);
    }
    return urls.map((u, i) => {
      const item = ok.find((x) => x.url_origin === u) ?? ok[i];
      const link = item?.aff_link; // aff_link only, never short_link
      if (typeof link !== 'string' || !link.startsWith('https://')) {
        throw new Error(`API returned no https aff_link for ${sub1}/${sub2}`);
      }
      return link;
    });
  }
  throw new Error(`Gave up on ${sub1}/${sub2} after ${RETRIES} retries (${lastErr})`);
}

/** Throws on any failure; the caller then leaves the old offers.json untouched. */
export async function buildOffers(config: OfferConfigItem[], deps: Deps): Promise<Offer[]> {
  validateConfig(config);
  const active = config.filter((c) => c.active);
  const generatedAt = deps.now().toISOString();
  const groups: Group[] = active.flatMap((c) =>
    PLACEMENTS.map((placement) => ({ placement, id: c.id, urls: [searchUrl(c.keyword)] })),
  );

  const links = new Map<string, string>();
  for (const g of groups) {
    for (let i = 0; i < g.urls.length; i += BATCH_SIZE) {
      const chunk = g.urls.slice(i, i + BATCH_SIZE);
      const out = await postBatch(deps, g.placement, g.id, chunk);
      out.forEach((l, k) => links.set(`${g.id}|${g.placement}|${chunk[k]}`, l));
      deps.log?.(`ok  ${g.placement.padEnd(6)} ${g.id}`);
    }
  }
  return active.map((c) => ({
    id: c.id,
    title: c.title,
    blurb: c.blurb,
    links: {
      result: links.get(`${c.id}|result|${searchUrl(c.keyword)}`) as string,
      tinh: links.get(`${c.id}|tinh|${searchUrl(c.keyword)}`) as string,
    },
    generatedAt,
    checkedAt: null,
    status: 'unchecked',
  }));
}

/** Featured banners: one aff_link per active item (sub1 = "featured", sub2 = id). Throws on any failure. */
export async function buildFeatured(config: FeaturedConfigItem[], deps: Deps): Promise<FeaturedLink[]> {
  validateFeaturedConfig(config);
  const generatedAt = deps.now().toISOString();
  const out: FeaturedLink[] = [];
  for (const f of config.filter((c) => c.active)) {
    const [affLink] = await postBatch(deps, 'featured', f.id, [f.targetUrl]);
    deps.log?.(`ok  featured ${f.id}`);
    out.push({ id: f.id, affLink: affLink as string, generatedAt, checkedAt: null, status: 'unchecked' });
  }
  return out;
}

export const CONFIG_PATH = 'data/offers.config.json';
export const OFFERS_PATH = 'data/offers.json';
export const FEATURED_CONFIG_PATH = 'data/featured.config.json';
export const FEATURED_PATH = 'data/featured.json';

export interface MainOpts {
  root?: string; // project root (tests use a temp dir)
  env?: NodeJS.ProcessEnv; // tests pass their own env so the real .env is never read
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  log?: (l: string) => void;
  err?: (l: string) => void;
}

export async function main(o: MainOpts = {}): Promise<number> {
  const root = o.root ?? '.';
  const log = o.log ?? console.log;
  const err = o.err ?? console.error;
  if (o.env === undefined) {
    try {
      process.loadEnvFile(`${root}/.env`);
    } catch {
      /* no .env file: fall through to the token check */
    }
  }
  const token = (o.env ?? process.env).ACCESSTRADE_TOKEN?.trim();
  if (!token) {
    err('ACCESSTRADE_TOKEN is missing. Put it in .env (see .env.example) and run again.');
    return 1;
  }
  const config = JSON.parse(readFileSync(`${root}/${CONFIG_PATH}`, 'utf8')) as OfferConfigItem[];
  const featuredCfgFile = `${root}/${FEATURED_CONFIG_PATH}`;
  const featuredConfig = existsSync(featuredCfgFile) ? (JSON.parse(readFileSync(featuredCfgFile, 'utf8')) as FeaturedConfigItem[]) : null;
  const target = `${root}/${OFFERS_PATH}`;
  const featuredTarget = `${root}/${FEATURED_PATH}`;
  try {
    const deps: Deps = {
      fetch: o.fetchFn ?? fetch,
      token,
      now: () => new Date(),
      sleep: o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
      log,
    };
    // Build everything first; only when ALL of it succeeded do we touch the files.
    const result = await buildOffers(config, deps);
    const featured = featuredConfig ? await buildFeatured(featuredConfig, deps) : null;
    writeFileSync(`${target}.tmp`, JSON.stringify(result, null, 2) + '\n');
    if (featured) writeFileSync(`${featuredTarget}.tmp`, JSON.stringify(featured, null, 2) + '\n');
    renameSync(`${target}.tmp`, target);
    if (featured) renameSync(`${featuredTarget}.tmp`, featuredTarget);
    log(`Wrote ${result.length} offer(s) to ${OFFERS_PATH}${featured ? ` and ${featured.length} featured banner(s) to ${FEATURED_PATH}` : ''}. Now run: npm run offers:check`);
    return 0;
  } catch (e) {
    err(`FAILED — ${OFFERS_PATH}${featuredConfig ? ` and ${FEATURED_PATH}` : ''} left unchanged. ${(e as Error).message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
