// Pure logic for affiliate category cards. No JSON/fs imports so scripts and Astro can share it.

export type Placement = 'result' | 'tinh';
export const PLACEMENTS: readonly Placement[] = ['result', 'tinh'];
export type OfferStatus = 'unchecked' | 'ok' | 'failed';

/** Total ad blocks per page, featured banners + category cards together. */
export const MAX_ADS_PER_PAGE = 2;
export const MAX_OFFERS_PER_PAGE = MAX_ADS_PER_PAGE;
export const MAX_AGE_DAYS = 30;
export const TITLE_MAX = 45;
export const BLURB_MAX = 50;
export const LABEL_MAX = 30;
/** Small label in the top corner of the offers block. */
export const DISCLOSURE = 'Quảng cáo';

export interface OfferConfigItem {
  id: string;
  /** Short category name shown small above the title. */
  label: string;
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

/** A generated card, shown with the text from the config (data/offers.json only supplies links). */
export type OfferView = Offer & { label: string };

// Category cards have no end date, so no price / discount / promo / quality words and no prices at all.
export const PRICE_WORDS = /(₫|%|\d\s?[kđ](?![\p{L}\p{N}])|\d{2,}[.,]\d{3}|giảm|sale|giá sốc|rẻ|free\s?ship|freeship|voucher|khuyến mãi|tốt nhất|chính hãng|miễn phí)/iu;

export function validateConfig(list: OfferConfigItem[]): void {
  const ids = new Set<string>();
  for (const c of list) {
    if (ids.has(c.id)) throw new Error(`offers.config.json: duplicate id "${c.id}"`);
    ids.add(c.id);
    if (c.title.trim() === '' || c.keyword.trim() === '' || c.label.trim() === '') {
      throw new Error(`offers.config.json: "${c.id}" needs a label, a title and a keyword`);
    }
    if (c.title.length > TITLE_MAX) throw new Error(`offers.config.json: "${c.id}" title must be at most ${TITLE_MAX} characters`);
    if (c.label.length > LABEL_MAX) throw new Error(`offers.config.json: "${c.id}" label must be at most ${LABEL_MAX} characters`);
    if (c.blurb.trim() === '' || c.blurb.length > BLURB_MAX) {
      throw new Error(`offers.config.json: "${c.id}" blurb must be 1–${BLURB_MAX} characters`);
    }
    if (PRICE_WORDS.test(`${c.label} ${c.title} ${c.blurb}`)) {
      throw new Error(`offers.config.json: "${c.id}" must not mention price/discount/promo/quality (cards have no end date)`);
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

export function isFresh(o: { checkedAt: string | null }, now: Date): boolean {
  if (o.checkedAt === null) return false;
  const t = Date.parse(o.checkedAt);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age <= MAX_AGE_DAYS * 86_400_000;
}

/** Offers allowed on a page, in config order: active + status ok + fresh check + https link. */
export function eligibleOffers(offers: Offer[], config: OfferConfigItem[], placement: Placement, now: Date): OfferView[] {
  return config.flatMap((c) => {
    const o = offers.find((x) => x.id === c.id);
    const ok =
      c.active && o !== undefined && o.status === 'ok' && isFresh(o, now) && o.links[placement].startsWith('https://');
    return ok ? [{ ...o, label: c.label, title: c.title, blurb: c.blurb }] : [];
  });
}

export function hashKey(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Slots left for category cards once `featuredCount` featured banners are on the page (banners win). */
export function offerSlots(featuredCount: number): number {
  return Math.max(0, MAX_ADS_PER_PAGE - featuredCount);
}

/**
 * Up to `slots` offers (default 2), rotating deterministically by page key so static pages stay stable
 * across builds. Pass `offerSlots(featuredCount)` so banner + cards never exceed 2 per page.
 */
export function pickOffers(
  offers: Offer[],
  config: OfferConfigItem[],
  placement: Placement,
  pageKey: string,
  now: Date,
  slots: number = MAX_ADS_PER_PAGE,
): OfferView[] {
  const list = eligibleOffers(offers, config, placement, now);
  if (list.length === 0 || slots <= 0) return [];
  const start = hashKey(pageKey) % list.length;
  const n = Math.min(slots, list.length);
  return Array.from({ length: n }, (_, i) => list[(start + i) % list.length] as OfferView);
}
