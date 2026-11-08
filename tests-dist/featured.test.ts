import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const all = readdirSync('dist', { recursive: true, encoding: 'utf8' });
const html = all.filter((f) => f.endsWith('.html'));
const read = (f: string) => readFileSync(join('dist', f), 'utf8');
const links = JSON.parse(readFileSync('data/featured.json', 'utf8')) as unknown[];

// Total gzip size of every built JS chunk when Part B started (the banner adds no client JS).
const JS_GZ_BASELINE = 7169;

describe('featured banner in dist/', () => {
  it('never appears on /nguon, /bang-ma or /404', () => {
    for (const f of ['nguon.html', 'bang-ma.html', '404.html']) expect(read(f), f).not.toMatch(/class="featured"|class="feat"/);
  });
  it('no valid banner → no featured markup anywhere (no gap)', () => {
    if (links.length > 0) return;
    for (const f of html) expect(read(f), f).not.toMatch(/<aside class="featured"|querySelectorAll\("\.featured"\)/); // markup + script only (CSS may ship)
  });
  it('when present, it sits at the end of <main>, right before the footer, only on the allowed pages', () => {
    for (const f of html) {
      const h = read(f);
      if (!h.includes('class="featured"')) continue;
      expect(f === 'index.html' || /^\d{2}\.html$/.test(f) || f.startsWith('tinh/'), f).toBe(true);
      expect(h, f).toMatch(/<\/aside><script>[^<]+<\/script><\/main>\s*<footer/);
    }
  });
  it('lookup JS did not grow (≤ +0.5 KB gzip in total) and contains no featured code', () => {
    const js = all.filter((f) => f.endsWith('.js'));
    const total = js.reduce((n, f) => n + gzipSync(readFileSync(join('dist', f)), { level: 9 }).length, 0);
    expect(total).toBeLessThanOrEqual(JS_GZ_BASELINE + 500);
    for (const f of js) expect(read(f), f).not.toMatch(/featured/i);
  });
});
