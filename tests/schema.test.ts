import { describe, expect, it } from 'vitest';
import { crumbItems } from '../src/lib/crumbs';
import { articleNode, itemListNode, organizationNode, pageGraph, websiteNode } from '../src/lib/schema';

const site = new URL('https://bienso.org');
const nodes = (g: Record<string, unknown>) => g['@graph'] as Record<string, unknown>[];
const types = (g: Record<string, unknown>) => nodes(g).map((n) => n['@type']);

describe('schema graph builders', () => {
  it('Organization is minimal: name, url, absolute 512 logo; nothing else', () => {
    const o = organizationNode(site);
    expect(Object.keys(o).sort()).toEqual(['@id', '@type', 'logo', 'name', 'url']);
    expect(o).toMatchObject({ '@id': 'https://bienso.org/#organization', name: 'Biển Số', url: 'https://bienso.org/', logo: { url: 'https://bienso.org/icon-512.png', width: 512, height: 512 } });
  });
  it('home: Organization + WebSite (full) + WebPage, no breadcrumb', () => {
    const g = pageGraph({ site, path: '/', name: 'T', description: 'D' });
    expect(types(g)).toEqual(['Organization', 'WebSite', 'WebPage']);
    expect(nodes(g)[1]).toEqual(websiteNode(site));
    expect(nodes(g)[2]).toMatchObject({ '@id': 'https://bienso.org/#webpage', isPartOf: { '@id': 'https://bienso.org/#website' } });
    expect(JSON.stringify(g)).not.toContain('breadcrumb');
  });
  it('other pages reference the WebSite by @id only and carry a BreadcrumbList', () => {
    const g = pageGraph({ site, path: '/83', name: 'T', description: 'D', crumbs: [{ name: 'Trang chủ', path: '/' }, { name: 'Biển số 83', path: '/83' }] });
    expect(types(g)).toEqual(['Organization', 'WebPage', 'BreadcrumbList']);
    expect(nodes(g)[1]).toMatchObject({ '@id': 'https://bienso.org/83#webpage', url: 'https://bienso.org/83', breadcrumb: { '@id': 'https://bienso.org/83#breadcrumb' } });
    expect(nodes(g)[2]).toMatchObject({ '@id': 'https://bienso.org/83#breadcrumb' });
    expect(g['@context']).toBe('https://schema.org');
  });
  it('CollectionPage + ItemList keep order and absolute URLs', () => {
    const list = itemListNode('https://bienso.org/x#itemlist', [{ name: 'B', path: '/b' }, { name: 'A', path: '/a' }], site);
    const g = pageGraph({ site, path: '/x', type: 'CollectionPage', name: 'T', description: 'D', mainEntityId: 'https://bienso.org/x#itemlist', extra: [list] });
    expect(nodes(g)[1]).toMatchObject({ '@type': 'CollectionPage', mainEntity: { '@id': 'https://bienso.org/x#itemlist' } });
    expect(list).toMatchObject({ numberOfItems: 2, itemListElement: [{ position: 1, url: 'https://bienso.org/b' }, { position: 2, url: 'https://bienso.org/a' }] });
  });
  it('Article: author/publisher = Organization @id, image absolute, mainEntityOfPage = #webpage', () => {
    const a = articleNode({ path: '/kien-thuc/x', h1: 'H', description: 'D', published: '2026-11-09', modified: '2026-11-09' }, site);
    expect(a).toMatchObject({
      '@id': 'https://bienso.org/kien-thuc/x#article', headline: 'H', inLanguage: 'vi', datePublished: '2026-11-09', dateModified: '2026-11-09',
      author: { '@id': 'https://bienso.org/#organization' }, publisher: { '@id': 'https://bienso.org/#organization' },
      image: 'https://bienso.org/og/default.png', mainEntityOfPage: { '@id': 'https://bienso.org/kien-thuc/x#webpage' },
    });
    expect(articleNode({ path: '/y', h1: 'H', description: 'D', published: 'a', modified: 'b', imagePath: '/og/83.png' }, site).image).toBe('https://bienso.org/og/83.png');
  });
  it('crumbItems makes absolute URLs', () => {
    expect(crumbItems([{ name: 'A', path: '/a' }], site)).toEqual([{ name: 'A', url: 'https://bienso.org/a' }]);
  });
  it('forbidden types never appear in the builders', () => {
    const all = JSON.stringify([organizationNode(site), websiteNode(site), pageGraph({ site, path: '/', name: 'T', description: 'D' })]);
    for (const t of ['Product', 'Review', 'AggregateRating', 'GovernmentOrganization', 'LocalBusiness', 'Person', 'SearchAction', 'potentialAction']) expect(all).not.toContain(t);
  });
});
