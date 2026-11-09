export interface Crumb {
  name: string;
  /** Site-relative path, e.g. "/tinh/can-tho". The LAST crumb is the current page. */
  path: string;
}

/** The same crumbs feed the visible <nav> and the BreadcrumbList node, so they cannot drift apart. */
export function crumbItems(crumbs: Crumb[], site: URL): { name: string; url: string }[] {
  return crumbs.map((c) => ({ name: c.name, url: new URL(c.path, site).href }));
}
