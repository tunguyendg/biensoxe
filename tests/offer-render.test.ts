import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import OfferCards from '../src/components/OfferCards.astro';
import FeaturedBanner from '../src/components/FeaturedBanner.astro';
import type { FeaturedConfigItem, FeaturedLink } from '../src/lib/featured';
import type { Offer, OfferConfigItem } from '../src/lib/offers';

const NOW = new Date('2026-11-08T00:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const IDS = ['camera-hanh-trinh', 'bom-lop-mini', 'gia-do-dien-thoai-xe-may', 'cam-bien-ap-suat-lop'];
const config = (over: Record<string, Partial<OfferConfigItem>> = {}): OfferConfigItem[] =>
  IDS.map((id) => ({ id, title: `T-${id}`, blurb: `B-${id}`, keyword: id, active: true, ...over[id] }));
const offer = (id: string, over: Partial<Offer> = {}): Offer => ({
  id, title: `T-${id}`, blurb: `B-${id}`,
  links: { result: `https://go.isclix.com/${id}?sub1=result`, tinh: `https://go.isclix.com/${id}?sub1=tinh` },
  generatedAt: days(1), checkedAt: days(1), status: 'ok', ...over,
});

async function render(props: Record<string, unknown>) {
  const c = await AstroContainer.create();
  return c.renderToString(OfferCards, { props: { now: NOW, ...props } });
}

describe('<OfferCards>', () => {
  it('renders nothing at all (no label, no wrapper) when there is no valid offer', async () => {
    expect((await render({ placement: 'result', pageKey: 'home', offers: [] })).trim()).toBe('');
    expect((await render({ placement: 'result', pageKey: 'home', offers: IDS.map((i) => offer(i, { status: 'failed' })), config: config() })).trim()).toBe('');
  });

  it('inactive, failed, unchecked and expired offers do not appear', async () => {
    const offers = [offer(IDS[0] as string), offer(IDS[1] as string, { status: 'failed' }), offer(IDS[2] as string, { checkedAt: days(40) }), offer(IDS[3] as string, { status: 'unchecked' })];
    const html = await render({ placement: 'result', pageKey: 'home', offers, config: config({ [IDS[0] as string]: { active: false } }) });
    expect(html.trim()).toBe('');
    const html2 = await render({ placement: 'result', pageKey: 'home', offers, config: config() });
    expect(html2).toContain('T-camera-hanh-trinh');
    for (const bad of IDS.slice(1)) expect(html2).not.toContain(`T-${bad}`);
  });

  it('shows at most 2 cards, with the disclosure label, full rel + referrerpolicy, and the placement link', async () => {
    const html = await render({ placement: 'tinh', pageKey: 'ha-noi', offers: IDS.map((i) => offer(i)), config: config() });
    expect(html.match(/class="offer"/g)).toHaveLength(2);
    expect(html).toContain('<p class="offers__label">Quảng cáo</p>');
    expect(html).not.toMatch(/hoa hồng|Liên kết tiếp thị/);
    expect(html.match(/rel="sponsored noopener noreferrer"/g)).toHaveLength(2);
    expect(html.match(/referrerpolicy="no-referrer"/g)).toHaveLength(2);
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html).toContain('sub1=tinh');
    expect(html).not.toContain('sub1=result');
    expect(html.match(/Xem trên Shopee/g)).toHaveLength(2);
  });

  it('has no price, discount, voucher or product image; icons are inline SVG', async () => {
    const html = await render({ placement: 'result', pageKey: '83', offers: IDS.map((i) => offer(i)), config: config() });
    expect(html).not.toMatch(/<img|₫|\bđ\b|giảm|voucher|khuyến mãi|%/i);
    expect(html).toContain('<svg');
    expect(html).not.toMatch(/<script/i);
  });

  it('is deterministic for a page key', async () => {
    const p = { placement: 'result', pageKey: '61', offers: IDS.map((i) => offer(i)), config: config() };
    expect(await render(p)).toBe(await render(p));
  });

  it('draws an icon for every known category and a fallback for unknown ids', async () => {
    const ids = [...IDS, 'khac'];
    for (const key of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const html = await render({ placement: 'result', pageKey: key, offers: ids.map((i) => offer(i)), config: ids.map((id) => ({ id, title: id, blurb: 'b', keyword: id, active: true })) });
      expect(html.match(/<svg/g)?.length).toBe(2);
    }
  });
});

describe('combined ad cap: at most 2 blocks per page (featured banners first, then category cards)', () => {
  const fcfg = (id: string): FeaturedConfigItem => ({ id, title: `F-${id}`, subtitle: 'S', targetUrl: 'https://shopee.vn/x', active: true });
  const flink = (id: string): FeaturedLink => ({ id, affLink: `https://go.isclix.com/f-${id}`, generatedAt: days(1), checkedAt: days(1), status: 'ok' });
  const offers = IDS.map((i) => offer(i));

  async function page(featuredIds: string[]) {
    const featured = { config: featuredIds.map(fcfg), links: featuredIds.map(flink) };
    const c = await AstroContainer.create();
    const cards = await c.renderToString(OfferCards, { props: { now: NOW, placement: 'result', pageKey: '83', offers, config: config(), featured } });
    const banner = await c.renderToString(FeaturedBanner, { props: { now: NOW, config: featured.config, links: featured.links } });
    return { cards: cards.match(/class="offer"/g)?.length ?? 0, banners: banner.match(/class="feat"/g)?.length ?? 0, cardsHtml: cards };
  }

  it('2 banners → 0 category cards (no label, no wrapper)', async () => {
    const p = await page(['a', 'b']);
    expect([p.banners, p.cards]).toEqual([2, 0]);
    expect(p.cardsHtml.trim()).toBe('');
  });
  it('1 banner → 1 category card', async () => {
    const p = await page(['a']);
    expect([p.banners, p.cards]).toEqual([1, 1]);
  });
  it('0 banners → 2 category cards', async () => {
    const p = await page([]);
    expect([p.banners, p.cards]).toEqual([0, 2]);
  });
  it('an invalid banner (stale check) does not take a slot', async () => {
    const featured = { config: [fcfg('a')], links: [{ ...flink('a'), checkedAt: days(45) }] };
    const c = await AstroContainer.create();
    const cards = await c.renderToString(OfferCards, { props: { now: NOW, placement: 'result', pageKey: '83', offers, config: config(), featured } });
    expect(cards.match(/class="offer"/g)).toHaveLength(2);
  });
});
