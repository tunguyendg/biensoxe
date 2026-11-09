import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import FeaturedBanner from '../src/components/FeaturedBanner.astro';
import { HIDE_EXPIRED_SCRIPT, type FeaturedConfigItem, type FeaturedLink } from '../src/lib/featured';

const NOW = new Date('2026-11-11T12:00:00+07:00');
const cfg = (id: string, over: Partial<FeaturedConfigItem> = {}): FeaturedConfigItem => ({
  id, title: `T-${id}`, subtitle: `S-${id}`, targetUrl: 'https://shopee.vn/x', startAt: '2026-11-11T00:00:00+07:00', endAt: '2026-11-12T00:00:00+07:00', active: true, ...over,
});
const lnk = (id: string, over: Partial<FeaturedLink> = {}): FeaturedLink => ({ id, affLink: `https://go.isclix.com/${id}`, generatedAt: 'g', checkedAt: '2026-11-08T00:00:00+07:00', status: 'ok', ...over });

const withoutEnd = (c: FeaturedConfigItem): FeaturedConfigItem => {
  const copy = { ...c };
  delete copy.endAt;
  return copy;
};

async function render(props: Record<string, unknown>) {
  const c = await AstroContainer.create();
  return c.renderToString(FeaturedBanner, { props: { now: NOW, ...props } });
}

describe('<FeaturedBanner>', () => {
  it('renders nothing at all — no wrapper, no label, no script — when nothing is valid', async () => {
    expect((await render({ config: [], links: [] })).trim()).toBe('');
    expect((await render({ config: [cfg('a', { active: false })], links: [lnk('a')] })).trim()).toBe('');
    expect((await render({ config: [cfg('a')], links: [lnk('a', { status: 'failed' })] })).trim()).toBe('');
    expect((await render({ config: [cfg('a')], links: [lnk('a')], now: new Date('2026-11-12T00:00:01+07:00') })).trim()).toBe('');
    expect((await render({ config: [cfg('a')], links: [lnk('a')], now: new Date('2026-11-10T00:00:00+07:00') })).trim()).toBe('');
  });

  it('a banner whose link was checked more than 30 days before the build is not rendered', async () => {
    const stale = lnk('a', { checkedAt: '2026-09-01T00:00:00+07:00' });
    expect((await render({ config: [cfg('a')], links: [stale] })).trim()).toBe('');
  });

  it('text card (no image): Quảng cáo label, icon, title, subtitle, CTA, link attributes, data-end', async () => {
    const html = await render({ config: [cfg('a')], links: [lnk('a')] });
    expect(html).toContain('<p class="featured__label">Quảng cáo</p>');
    expect(html).toContain('aria-label="Quảng cáo"');
    expect(html).toContain('T-a');
    expect(html).toContain('S-a');
    expect(html).toContain('Xem chương trình →');
    expect(html).toContain('<span class="feat__chip">Đến hết 11/11</span>');
    expect(html).toContain('<svg');
    expect(html).not.toContain('<img');
    expect(html).toContain('href="https://go.isclix.com/a"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="sponsored noopener noreferrer"');
    expect(html).toContain('referrerpolicy="no-referrer"');
    expect(html).toContain('data-end="2026-11-12T00:00:00+07:00"');
    expect(html).toContain(HIDE_EXPIRED_SCRIPT);
  });

  it('with an image: fixed width/height, lazy, async, alt', async () => {
    const html = await render({ config: [cfg('a', { image: '/featured/a.webp' })], links: [lnk('a')] });
    const img = /<img\b[^>]*>/.exec(html)?.[0] ?? '';
    expect(img).toContain('src="/featured/a.webp"');
    expect(img).toContain('width="112"');
    expect(img).toContain('height="112"');
    expect(img).toContain('loading="lazy"');
    expect(img).toContain('decoding="async"');
    expect(img).toContain('alt="T-a"');
    expect(html).not.toContain('<svg class="feat__icon"');
  });

  it('shows at most 2 cards; an item without endAt has no data-end', async () => {
    const html = await render({ config: [cfg('a'), withoutEnd(cfg('b')), cfg('c')], links: [lnk('a'), lnk('b'), lnk('c')] });
    expect(html.match(/class="feat"/g)).toHaveLength(2);
    expect(html).not.toContain('T-c');
    expect(html.match(/data-end=/g)).toHaveLength(1);
  });
});

describe('placement: only home, /[code], /tinh/[slug] — never /nguon, /bang-ma, /404', () => {
  const pagesDir = 'src/pages';
  const pages = readdirSync(pagesDir, { recursive: true, encoding: 'utf8' }).filter((f) => /\.astro$/.test(f));
  it('FeaturedBanner is mounted exactly on the three allowed page types, at the end of <main>', () => {
    const using = pages.filter((f) => readFileSync(join(pagesDir, f), 'utf8').includes('<FeaturedBanner'));
    expect(using.sort()).toEqual(['[code].astro', 'index.astro', 'tinh/[slug].astro']);
    for (const f of using) expect(readFileSync(join(pagesDir, f), 'utf8')).toMatch(/<FeaturedBanner \/>\n\s*<\/main>/);
  });
  it('the forbidden pages do not reference it', () => {
    for (const f of pages.filter((p) => /^(nguon|bang-ma|404)\.astro$/.test(p))) expect(readFileSync(join(pagesDir, f), 'utf8')).not.toMatch(/Featured/);
  });
});
