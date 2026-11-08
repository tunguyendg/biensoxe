import type { APIRoute } from 'astro';

// Draft builds are kept out of search engines by <meta robots noindex> on every page (crawlers must
// be allowed to fetch the page to see it), so robots.txt only advertises the sitemap.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
