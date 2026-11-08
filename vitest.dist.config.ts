import { defineConfig } from 'vitest/config';

// Post-build checks that read dist/. Run via `npm run test:dist` (part of `npm run verify`).
export default defineConfig({ test: { include: ['tests-dist/**/*.test.ts'] } });
