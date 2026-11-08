import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';

// Build-time only (never shipped to the browser). Be Vietnam Pro covers full Vietnamese diacritics.
const dir = join(process.cwd(), 'node_modules/@fontsource/be-vietnam-pro/files');
const load = (n: string) => readFileSync(join(dir, `be-vietnam-pro-${n}-normal.woff`));
// Satori falls back per glyph only across *different* family names, so each subset gets its own name.
const SUBSETS = ['latin', 'vietnamese', 'latin-ext'] as const;
const FAMILY = SUBSETS.map((n) => `BVP-${n}`).join(', ');
let fonts: { name: string; data: Buffer; weight: 700 | 800; style: 'normal' }[] | undefined;
function getFonts() {
  fonts ??= SUBSETS.flatMap((n) =>
    ([700, 800] as const).map((weight) => ({ name: `BVP-${n}`, data: load(`${n}-${weight}`), weight, style: 'normal' as const })),
  );
  return fonts;
}

export interface OgInput {
  /** Big text on the plate, e.g. "83". */
  plate: string;
  /** Main line, e.g. the current province. */
  title: string;
  /** Optional smaller line, e.g. "Trước 01/07/2025: Sóc Trăng". */
  subtitle?: string;
}

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, ...(children === undefined ? {} : { children }) },
});

/** 1200×630 PNG: a simple plate graphic + province. No photos, no emblems. */
export async function renderOgPng({ plate, title, subtitle }: OgInput): Promise<Uint8Array> {
  const tree = el('div', { width: 1200, height: 630, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f4f6fa', fontFamily: FAMILY, color: '#14213d' }, [
    el('div', { alignItems: 'center', justifyContent: 'center', width: 520, height: 210, background: '#ffffff', border: '10px solid #111111', borderRadius: 28, fontSize: 150, fontWeight: 800, color: '#111111', letterSpacing: 6 }, plate),
    el('div', { marginTop: 48, maxWidth: 1040, fontSize: title.length > 18 ? 56 : 84, fontWeight: 800, color: '#0b57d0', textAlign: 'center' }, title),
    ...(subtitle ? [el('div', { marginTop: 16, maxWidth: 1040, fontSize: 42, fontWeight: 700, color: '#4d5870' }, subtitle)] : []),
    el('div', { position: 'absolute', bottom: 36, fontSize: 30, fontWeight: 700, color: '#4d5870' }, 'BIEN SO — tra cứu mã biển số xe'),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: getFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: false } }).render().asPng();
}
