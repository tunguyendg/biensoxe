/**
 * One-off generator for the favicon set (output is committed in public/).
 *   npx tsx scripts/make-icons.ts
 * A plain licence-plate shape with "83": no state emblem, no real plate.
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';

const dir = join(process.cwd(), 'node_modules/@fontsource/be-vietnam-pro/files');
const font = { name: 'BVP', data: readFileSync(join(dir, 'be-vietnam-pro-latin-800-normal.woff')), weight: 800 as const, style: 'normal' as const };

type N = { type: string; props: Record<string, unknown> };
const div = (style: Record<string, unknown>, children?: unknown): N => ({ type: 'div', props: { style: { display: 'flex', ...style }, ...(children === undefined ? {} : { children }) } });

/** size = canvas px; pad = share of the canvas left around the plate; bg = canvas colour or none. */
async function svg(size: number, pad: number, bg?: string): Promise<string> {
  const w = Math.round(size * (1 - 2 * pad));
  const h = Math.round(w * 0.62);
  const bw = Math.max(2, Math.round(size * 0.05));
  const plate = div({ width: w, height: h, alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: `${bw}px solid #111111`, borderRadius: Math.round(size * 0.12), fontFamily: 'BVP', fontWeight: 800, fontSize: Math.round(h * 0.62), color: '#111111' }, '83');
  const root = div({ width: size, height: size, alignItems: 'center', justifyContent: 'center', ...(bg ? { background: bg } : {}) }, [plate]);
  return satori(root as never, { width: size, height: size, fonts: [font] });
}

const png = (s: string, size: number) => new Resvg(s, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } }).render().asPng();

writeFileSync('public/favicon.svg', await svg(64, 0.04));
writeFileSync('public/favicon-32.png', png(await svg(32, 0.02), 32));
writeFileSync('public/apple-touch-icon.png', png(await svg(180, 0.14, '#0b57d0'), 180));
writeFileSync('public/icon-192.png', png(await svg(192, 0.14, '#0b57d0'), 192));
writeFileSync('public/icon-512.png', png(await svg(512, 0.14, '#0b57d0'), 512));
console.log('icons written to public/');
