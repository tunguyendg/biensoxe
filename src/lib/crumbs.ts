import { breadcrumbLd, type JsonLd } from './jsonld';

export interface Crumb {
  name: string;
  /** Site-relative path, e.g. "/tinh/can-tho". The LAST crumb is the current page. */
  path: string;
}

/** The same crumbs feed the visible <nav> and the BreadcrumbList JSON-LD, so they cannot drift apart. */
export function crumbsLd(crumbs: Crumb[], site: URL): JsonLd {
  return breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: new URL(c.path, site).href })));
}
