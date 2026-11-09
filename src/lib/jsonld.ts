import type { Faq } from './faq';

export type JsonLd = Record<string, unknown>;

/** BreadcrumbList node (no @context: it lives inside the page's @graph). */
export function breadcrumbNode(id: string, items: { name: string; url: string }[]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    '@id': id,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

/** FAQPage node. Only used where the same questions are visible on the page (/nguon). */
export function faqNode(id: string, faq: Faq[]): JsonLd {
  return {
    '@type': 'FAQPage',
    '@id': id,
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** JSON for an inline <script type="application/ld+json">; `<` is escaped so it can't close the tag. */
export function ldString(ld: JsonLd): string {
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}
