// Pure logic for affiliate category cards. No JSON/fs imports so scripts and Astro can share it.

export type Placement = 'result' | 'tinh';
export const PLACEMENTS: readonly Placement[] = ['result', 'tinh'];
export type OfferStatus = 'unchecked' | 'ok' | 'failed';

export const MAX_OFFERS_PER_PAGE = 2;
export const MAX_AGE_DAYS = 30;
export const BLURB_MAX = 60;
/** Small label in the top corner of the offers block. */
export const DISCLOSURE = 'Quảng cáo';

export interface OfferConfigItem {
  id: string;
  title: string;
  blurb: string;
  keyword: string;
  active: boolean;
}

export interface Offer {
  id: string;
  title: string;
  blurb: string;
  links: Record<Placement, string>;
  generatedAt: string;
  checkedAt: string | null;
  status: OfferStatus;
}

// No price / discount / quality promises in blurbs.
const PRICE_WORDS = /(₫|\d\s?(k|đ|%)\b|giảm|voucher|khuyến mãi|rẻ|tốt nhất|chính hãng|miễn phí|giá rẻ)/i;

export function validateConfig(list: OfferConfigItem[]): void {
  const ids = new Set<string>();
  for (const c of list) {
    if (ids.has(c.id)) throw new Error(`offers.config.json: duplicate id "${c.id}"`);
    ids.add(c.id);
    if (c.title.trim() === '' || c.keyword.trim() === '') {
      throw new Error(`offers.config.json: "${c.id}" needs a title and a keyword`);
    }
    if (c.blurb.trim() === '' || c.blurb.length > BLURB_MAX) {
      throw new Error(`offers.config.json: "${c.id}" blurb must be 1–${BLURB_MAX} characters`);
    }
    if (PRICE_WORDS.test(c.blurb)) {
      throw new Error(`offers.config.json: "${c.id}" blurb must not mention price/discount/quality`);
    }
  }
}

/** Build gate: every stored link must be https. */
export function validateOffers(list: Offer[]): void {
  for (const o of list) {
    for (const pl of PLACEMENTS) {
      if (!o.links[pl].startsWith('https://')) {
        throw new Error(`offers.json: "${o.id}".links.${pl} must be an https:// url`);
      }
    }
  }
}

export function isFresh(o: Offer, now: Date): boolean {
  if (o.checkedAt === null) return false;
  const t = Date.parse(o.checkedAt);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age <= MAX_AGE_DAYS * 86_400_000;
}

/** Offers allowed on a page, in config order: active + status ok + fresh check + https link. */
export function eligibleOffers(offers: Offer[], config: OfferConfigItem[], placement: Placement, now: Date): Offer[] {
  return config.flatMap((c) => {
    const o = offers.find((x) => x.id === c.id);
    const ok =
      c.active && o !== undefined && o.status === 'ok' && isFresh(o, now) && o.links[placement].startsWith('https://');
    return ok ? [o] : [];
  });
}

export function hashKey(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0;
  return h;
}

/** At most 2 offers, rotating deterministically by page key so static pages stay stable across builds. */
export function pickOffers(
  offers: Offer[],
  config: OfferConfigItem[],
  placement: Placement,
  pageKey: string,
  now: Date,
): Offer[] {
  const list = eligibleOffers(offers, config, placement, now);
  if (list.length === 0) return [];
  const start = hashKey(pageKey) % list.length;
  const n = Math.min(MAX_OFFERS_PER_PAGE, list.length);
  return Array.from({ length: n }, (_, i) => list[(start + i) % list.length] as Offer);
}
