// Pure logic for the Founder-managed "featured" banners (max 2, with an optional run window).

export const MAX_FEATURED = 2;
export const TITLE_MAX = 50;
export const SUBTITLE_MAX = 80;
export const IMAGE_MAX_BYTES = 60 * 1024;

export type FeaturedStatus = 'unchecked' | 'ok' | 'failed';

export interface FeaturedConfigItem {
  id: string;
  title: string;
  subtitle: string;
  /** Shopee product / shop / campaign page (https://shopee.vn/… or https://shp.ee/…). */
  targetUrl: string;
  /** Optional, /featured/<name>.webp (≤ 60 KB) in public/featured/. */
  image?: string;
  /** ISO with an explicit offset, e.g. 2026-11-11T00:00:00+07:00. Missing = no bound. */
  startAt?: string;
  endAt?: string;
  active: boolean;
}

export interface FeaturedLink {
  id: string;
  affLink: string;
  generatedAt: string;
  checkedAt: string | null;
  status: FeaturedStatus;
}

export interface FeaturedShown {
  item: FeaturedConfigItem;
  href: string;
}

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Words that read as a price/promo claim. Allowed only when the banner has an end date.
const PROMO = /(%|₫|giảm|voucher|free\s?ship|freeship|\d\s?[kđ](?![\p{L}\p{N}])|(?<![\p{L}\p{N}])[kđ](?![\p{L}\p{N}]))/iu;

export function isShopeeTarget(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return u.protocol === 'https:' && (h === 'shopee.vn' || h.endsWith('.shopee.vn') || h === 'shp.ee');
  } catch {
    return false;
  }
}

/** Build gate for data/featured.config.json. Throws on the first problem. */
export function validateFeaturedConfig(list: FeaturedConfigItem[]): void {
  const ids = new Set<string>();
  for (const f of list) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(f.id)) throw new Error(`featured.config.json: bad id "${f.id}" (lowercase letters, digits, hyphens)`);
    if (ids.has(f.id)) throw new Error(`featured.config.json: duplicate id "${f.id}"`);
    ids.add(f.id);
    if (f.title.trim() === '' || f.title.length > TITLE_MAX) throw new Error(`featured.config.json: "${f.id}" title must be 1–${TITLE_MAX} characters`);
    if (f.subtitle.trim() === '' || f.subtitle.length > SUBTITLE_MAX) throw new Error(`featured.config.json: "${f.id}" subtitle must be 1–${SUBTITLE_MAX} characters`);
    for (const k of ['startAt', 'endAt'] as const) {
      const v = f[k];
      if (v !== undefined && (!ISO_WITH_OFFSET.test(v) || Number.isNaN(Date.parse(v)))) {
        throw new Error(`featured.config.json: "${f.id}".${k} must be ISO with an offset, e.g. 2026-11-11T00:00:00+07:00`);
      }
    }
    if (f.startAt !== undefined && f.endAt !== undefined && Date.parse(f.startAt) >= Date.parse(f.endAt)) {
      throw new Error(`featured.config.json: "${f.id}" startAt must be before endAt`);
    }
    if (f.image !== undefined && !/^\/featured\/[\w.-]+\.webp$/.test(f.image)) {
      throw new Error(`featured.config.json: "${f.id}" image must be /featured/<name>.webp`);
    }
    if (PROMO.test(`${f.title} ${f.subtitle}`) && f.endAt === undefined) {
      throw new Error(`featured.config.json: "${f.id}" mentions price/discount/voucher/free ship, so it needs an endAt`);
    }
    if (f.active && !isShopeeTarget(f.targetUrl)) {
      throw new Error(`featured.config.json: active "${f.id}" targetUrl must be https://shopee.vn/… or https://shp.ee/… (got "${f.targetUrl}")`);
    }
  }
  const active = list.filter((f) => f.active).length;
  if (active > MAX_FEATURED) throw new Error(`featured.config.json: ${active} active items, at most ${MAX_FEATURED} allowed`);
}

/** Build gate for data/featured.json: stored links must be https. */
export function validateFeaturedLinks(list: FeaturedLink[]): void {
  for (const l of list) {
    if (!l.affLink.startsWith('https://')) throw new Error(`featured.json: "${l.id}".affLink must be an https:// url`);
  }
}

/** Active, status ok, inside [startAt, endAt), at most 2, in config order. */
export function activeFeatured(config: FeaturedConfigItem[], links: FeaturedLink[], now: Date): FeaturedShown[] {
  const t = now.getTime();
  const out: FeaturedShown[] = [];
  for (const item of config) {
    const link = links.find((l) => l.id === item.id);
    if (!item.active || !link || link.status !== 'ok' || !link.affLink.startsWith('https://')) continue;
    if (item.startAt !== undefined && Date.parse(item.startAt) > t) continue;
    if (item.endAt !== undefined && Date.parse(item.endAt) <= t) continue;
    out.push({ item, href: link.affLink });
  }
  return out.slice(0, MAX_FEATURED);
}

/**
 * Inline script (static site, no rebuild at expiry): hides banners whose data-end has passed in the
 * visitor's browser, and hides the whole area when none is left. Must stay ≤ 300 bytes.
 */
export const HIDE_EXPIRED_SCRIPT =
  'var n=Date.now();document.querySelectorAll(".featured").forEach(function(s){var a=0;s.querySelectorAll(".feat").forEach(function(e){var d=e.dataset.end;d&&Date.parse(d)<=n?e.hidden=!0:a=1});s.hidden=!a})';
