import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Runs after `npm run build` (part of `npm run verify`).
const files = readdirSync('dist', { recursive: true, encoding: 'utf8' }).filter((f) => !f.endsWith('.png') && !f.endsWith('.webp'));
const html = files.filter((f) => f.endsWith('.html'));
const token = process.env.ACCESSTRADE_TOKEN?.trim();

describe('dist/', () => {
  it('exists and has the home page', () => {
    expect(existsSync('dist/index.html')).toBe(true);
  });

  it('never contains "Authorization" or the ACCESSTRADE token (if set)', () => {
    for (const f of files) {
      const p = join('dist', f);
      if (!/\.(html|js|css|json|txt|xml|map|svg)$/.test(f)) continue;
      const text = readFileSync(p, 'utf8');
      expect(text, p).not.toMatch(/Authorization/i);
      if (token) expect(text, p).not.toContain(token);
    }
  });

  it('/nguon, /bang-ma and /404 never carry affiliate markup', () => {
    for (const f of html.filter((p) => /^(nguon|bang-ma|404)(\/index)?\.html$/.test(p))) {
      expect(readFileSync(join('dist', f), 'utf8'), f).not.toMatch(/class="offers"|sponsored/);
    }
  });

  it('the affiliate area is absent while offers.json is empty', () => {
    const offers = JSON.parse(readFileSync('data/offers.json', 'utf8')) as unknown[];
    if (offers.length > 0) return;
    for (const f of html) expect(readFileSync(join('dist', f), 'utf8'), f).not.toMatch(/class="offers"|Liên kết tiếp thị/);
  });

  it('every offer link in dist is https and carries the full rel/referrerpolicy', () => {
    for (const f of html) {
      const text = readFileSync(join('dist', f), 'utf8');
      for (const m of text.matchAll(/<a class="offer"[^>]*>/g)) {
        expect(m[0]).toMatch(/href="https:\/\//);
        expect(m[0]).toContain('rel="sponsored noopener noreferrer"');
        expect(m[0]).toContain('referrerpolicy="no-referrer"');
      }
    }
  });
});
