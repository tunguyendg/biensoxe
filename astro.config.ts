import { defineConfig } from 'astro/config';
import { assertStrictBuild } from './src/lib/strict';
import { data } from './src/lib/data';
import { offers, validateOffers } from './src/lib/offers';

// Production gate: with BIEN_SO_STRICT=1 the build fails while any record is unverified.
export default defineConfig({
  output: 'static',
  integrations: [
    {
      name: 'bien-so-strict-gate',
      hooks: {
        'astro:config:setup': () => {
          assertStrictBuild(data, process.env.BIEN_SO_STRICT);
          validateOffers(offers); // active offers must be https
        },
      },
    },
  ],
});
