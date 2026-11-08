import type { Faq } from './faq';

export type JsonLd = Record<string, unknown>;

export function breadcrumbLd(items: { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function faqLd(faq: Faq[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** JSON for an inline <script type="application/ld+json">; `<` is escaped so it can't close the tag. */
export function ldString(ld: JsonLd): string {
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}
