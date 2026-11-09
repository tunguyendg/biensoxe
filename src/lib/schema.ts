import { crumbItems, type Crumb } from './crumbs';
import { breadcrumbNode, type JsonLd } from './jsonld';

// One JSON-LD block per page: {"@context", "@graph": [...]}, with stable @ids.
// Not used on purpose: Product, Review, AggregateRating, GovernmentOrganization, LocalBusiness, Person, SearchAction.

export const BRAND = 'Biển Số';
export const DEFAULT_OG = '/og/default.png';
export const LOGO_PATH = '/icon-512.png';

export const orgId = (site: URL) => `${site.origin}/#organization`;
export const websiteId = (site: URL) => `${site.origin}/#website`;
const abs = (path: string, site: URL) => new URL(path, site).href;
const ref = (id: string) => ({ '@id': id });

/** Minimal Organization: name, url, logo. No address, contact, sameAs or founder. */
export function organizationNode(site: URL): JsonLd {
  return {
    '@type': 'Organization',
    '@id': orgId(site),
    name: BRAND,
    url: abs('/', site),
    logo: { '@type': 'ImageObject', url: abs(LOGO_PATH, site), width: 512, height: 512 },
  };
}

/** Full WebSite definition (home page only; other pages reference it by @id). */
export function websiteNode(site: URL): JsonLd {
  return { '@type': 'WebSite', '@id': websiteId(site), name: BRAND, url: abs('/', site), inLanguage: 'vi', publisher: ref(orgId(site)) };
}

export interface PageSchemaInput {
  site: URL;
  /** Site-relative canonical path, e.g. "/83". */
  path: string;
  type?: 'WebPage' | 'CollectionPage';
  /** Same strings as <title> and the meta description. */
  name: string;
  description: string;
  /** Visible breadcrumb (home has none). */
  crumbs?: Crumb[];
  /** Extra nodes (ItemList, Article, FAQPage). Their @id should be `${canonical}#…`. */
  extra?: JsonLd[];
  /** @id of the node that is the page's main entity (e.g. the ItemList). */
  mainEntityId?: string;
}

export function pageGraph(i: PageSchemaInput): JsonLd {
  const { site, path } = i;
  const url = abs(path, site);
  const isHome = path === '/';
  const page: JsonLd = {
    '@type': i.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: i.name,
    description: i.description,
    inLanguage: 'vi',
    isPartOf: ref(websiteId(site)),
    ...(i.crumbs ? { breadcrumb: ref(`${url}#breadcrumb`) } : {}),
    ...(i.mainEntityId ? { mainEntity: ref(i.mainEntityId) } : {}),
  };
  const graph: JsonLd[] = [
    organizationNode(site),
    ...(isHome ? [websiteNode(site)] : []),
    page,
    ...(i.crumbs ? [breadcrumbNode(`${url}#breadcrumb`, crumbItems(i.crumbs, site))] : []),
    ...(i.extra ?? []),
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** ItemList of internal URLs, in the order they are shown. */
export function itemListNode(id: string, items: { name: string; path: string }[], site: URL): JsonLd {
  return {
    '@type': 'ItemList',
    '@id': id,
    numberOfItems: items.length,
    itemListElement: items.map((it, n) => ({ '@type': 'ListItem', position: n + 1, url: abs(it.path, site), name: it.name })),
  };
}

export interface ArticleNodeInput {
  path: string;
  h1: string;
  description: string;
  published: string;
  modified: string;
  /** Absolute-able path of the OG image the page uses. */
  imagePath?: string;
}

export function articleNode(a: ArticleNodeInput, site: URL): JsonLd {
  const url = abs(a.path, site);
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: a.h1,
    description: a.description,
    inLanguage: 'vi',
    datePublished: a.published,
    dateModified: a.modified,
    author: ref(orgId(site)),
    publisher: ref(orgId(site)),
    image: abs(a.imagePath ?? DEFAULT_OG, site),
    mainEntityOfPage: ref(`${url}#webpage`),
  };
}
