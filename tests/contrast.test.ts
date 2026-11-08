import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/theme.css', 'utf8');
const block = (start: string) => {
  const i = css.indexOf(start);
  return css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
};
const vars = (b: string) => Object.fromEntries([...b.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]])) as Record<string, string>;
const light = vars(block(':root {'));
const dark = { ...light, ...vars(css.slice(css.indexOf('prefers-color-scheme: dark'), css.indexOf('body {'))) };

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (c[0] as number) + 0.7152 * (c[1] as number) + 0.0722 * (c[2] as number);
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

const PAIRS: [string, string][] = [
  ['fg', 'bg'], ['fg', 'card'], ['muted', 'bg'], ['muted', 'card'], ['muted', 'info-bg'], ['muted', 'offer-bg'],
  ['fg', 'info-bg'], ['accent', 'bg'], ['accent', 'card'], ['accent', 'info-bg'], ['on-accent', 'accent'],
  ['card', 'fg'], ['warn-fg', 'warn-bg'],
];

describe.each([['light', light], ['dark', dark]] as const)('WCAG AA text contrast (%s)', (_name, v) => {
  it('has all tokens', () => {
    for (const [a, b] of PAIRS) expect(v[a] && v[b], `${a}/${b}`).toBeTruthy();
  });
  it.each(PAIRS)('%s on %s ≥ 4.5:1', (a, b) => {
    expect(ratio(v[a] as string, v[b] as string)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('dark mode wiring', () => {
  it('follows the system and redefines every colour token', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    const l = Object.keys(vars(block(':root {')));
    const d = Object.keys(vars(css.slice(css.indexOf('prefers-color-scheme: dark'), css.indexOf('body {'))));
    expect(d.sort()).toEqual(l.sort());
  });
});
