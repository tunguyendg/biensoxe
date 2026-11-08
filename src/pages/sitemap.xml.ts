import type { APIRoute } from 'astro';
import { data } from '../lib/data';

export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/bang-ma', '/nguon', ...data.provinces.map((p) => `/tinh/${p.slug}`), ...data.codes.map((c) => `/${c.code}`)];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc><lastmod>${data.meta.lastReviewed}</lastmod></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
