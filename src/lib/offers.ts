import raw from '../../data/offers.json';

export type Placement = 'result' | 'tinh' | 'code';
export const PLACEMENTS: readonly Placement[] = ['result', 'tinh', 'code'];
export const MAX_OFFERS_PER_PAGE = 2;
export const MAX_IMAGE_BYTES = 40 * 1024;
export const DISCLOSURE = 'Liên kết tiếp thị — BIEN SO có thể nhận hoa hồng.';

export interface Offer {
  id: string;
  title: string;
  description: string;
  url: string;
  image?: string;
  placements: Placement[];
  active: boolean;
}

export const offers = raw as Offer[];

// Policy: no license-plate frames or covers.
const FORBIDDEN = /(khung|ốp|op)\s*(biển|bien)/i;

/** Build-time gate. Throws on any active offer that is not safe to publish. */
export function validateOffers(list: Offer[]): void {
  const ids = new Set<string>();
  for (const o of list) {
    if (ids.has(o.id)) throw new Error(`offers.json: duplicate id "${o.id}"`);
    ids.add(o.id);
    for (const pl of o.placements) {
      if (!PLACEMENTS.includes(pl)) throw new Error(`offers.json: "${o.id}" has unknown placement "${pl}"`);
    }
    if (FORBIDDEN.test(`${o.title} ${o.description}`)) {
      throw new Error(`offers.json: "${o.id}" promotes plate frames/covers, which is not allowed`);
    }
    if (o.image !== undefined && !/^\/offers\/[\w.-]+\.webp$/.test(o.image)) {
      throw new Error(`offers.json: "${o.id}" image must be /offers/<name>.webp`);
    }
    if (o.active && !o.url.startsWith('https://')) {
      throw new Error(`offers.json: active offer "${o.id}" must have an https:// url (got "${o.url}")`);
    }
  }
}

/** Offers that may be rendered on a page: active + https only, at most 2, in file order. */
export function selectOffers(list: Offer[], placement: Placement): Offer[] {
  return list
    .filter((o) => o.active && o.url.startsWith('https://') && o.placements.includes(placement))
    .slice(0, MAX_OFFERS_PER_PAGE);
}
