import { defineConfig } from 'astro/config';
import { existsSync, statSync } from 'node:fs';
import { assertStrictBuild } from './src/lib/strict';
import { readAuditGate } from './src/lib/audit-gate';
import { data } from './src/lib/data';
import { IMAGE_MAX_BYTES, validateFeaturedConfig, validateFeaturedLinks } from './src/lib/featured';
import { featuredConfig, featuredLinks } from './src/lib/featured-data';
import { validateConfig, validateOffers } from './src/lib/offers';
import { offerConfig, offers } from './src/lib/offers-data';

// Production gate: with BIEN_SO_STRICT=1 the build fails while any record is unverified.
export default defineConfig({
  output: 'static',
  // Real domain is set via SITE_URL (required for strict/production builds). Localhost is fine for drafts.
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  // /83 → dist/83.html: Cloudflare Pages serves it at the clean URL /83 (no trailing slash).
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [
    {
      name: 'bien-so-strict-gate',
      hooks: {
        'astro:config:setup': () => {
          assertStrictBuild(data, process.env.BIEN_SO_STRICT, process.env.SITE_URL, readAuditGate());
          validateConfig(offerConfig);
          validateOffers(offers); // stored links must be https
          validateFeaturedConfig(featuredConfig); // ≤ 2 active, shopee/shp.ee https targets, promo wording needs endAt
          validateFeaturedLinks(featuredLinks);
          for (const f of featuredConfig) {
            if (!f.image) continue;
            const file = `public${f.image}`;
            if (!existsSync(file) || statSync(file).size > IMAGE_MAX_BYTES) {
              throw new Error(`featured.config.json: "${f.id}" image ${f.image} must exist in public/ and be ≤ 60 KB`);
            }
          }
        },
      },
    },
  ],
});
