import { defineConfig } from 'astro/config';
import { assertStrictBuild } from './src/lib/strict';
import { data } from './src/lib/data';
import { validateConfig, validateOffers } from './src/lib/offers';
import { offerConfig, offers } from './src/lib/offers-data';

// Production gate: with BIEN_SO_STRICT=1 the build fails while any record is unverified.
export default defineConfig({
  output: 'static',
  integrations: [
    {
      name: 'bien-so-strict-gate',
      hooks: {
        'astro:config:setup': () => {
          assertStrictBuild(data, process.env.BIEN_SO_STRICT);
          validateConfig(offerConfig);
          validateOffers(offers); // stored links must be https
        },
      },
    },
  ],
});
