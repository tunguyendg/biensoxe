import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
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

const LOGO = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), 'brand/logo-horizontal-dark.svg')).toString('base64')}`;
const ARROW = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40"><path d="M4 20h46M36 5l16 15-16 15" fill="none" stroke="#F59E0B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>').toString('base64')}`;

export interface OgInput {
  /** Big text on the plate, e.g. "83". */
  plate: string;
  /** Current province (or the label of a special code). */
  title: string;
  /** Province before 01/07/2025; omit when the name did not change. */
  former?: string;
}

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, ...(children === undefined ? {} : { children }) },
});
const img = (src: string, width: number, height: number, style: Record<string, unknown> = {}): Node => ({
  type: 'img',
  props: { src, width, height, style },
});

/** 1200×630 PNG in the Biển Số brand colours: plate graphic, logo, former → current province. No photos, no emblems. */
export async function renderOgPng({ plate, title, former }: OgInput): Promise<Uint8Array> {
  const long = title.length + (former?.length ?? 0) > 26;
  const size = former ? (long ? 44 : 56) : title.length > 18 ? 60 : 84;
  const tree = el('div', { width: 1200, height: 630, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1F4D', backgroundImage: 'linear-gradient(150deg, #0B1F4D 40%, #1D4ED8 130%)', fontFamily: FAMILY, color: '#ffffff' }, [
    img(LOGO, 180, 60, { position: 'absolute', top: 40, left: 56 }),
    el('div', { alignItems: 'center', justifyContent: 'center', width: 520, height: 210, background: '#ffffff', border: '12px solid #0B1F4D', borderRadius: 28, boxShadow: '0 0 0 3px rgba(219,234,254,0.5), 0 12px 16px rgba(0,0,0,0.35)', fontSize: 150, fontWeight: 800, color: '#0B1F4D', letterSpacing: 6 }, plate),
    el('div', { marginTop: 52, maxWidth: 1100, alignItems: 'center', justifyContent: 'center' }, [
      ...(former
        ? [
            el('div', { fontSize: size, fontWeight: 700, color: '#BFD0F5' }, former),
            img(ARROW, 64, 40, { margin: '0 28px' }),
          ]
        : []),
      el('div', { fontSize: size, fontWeight: 800, color: '#ffffff' }, title),
    ]),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: getFonts() });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: false } }).render().asPng();
  // The gradient makes a truecolour PNG ~130 KB; a dithered 128-colour palette keeps it well under 60 KB.
  return sharp(png).png({ palette: true, colours: 128, dither: 0.6, effort: 8 }).toBuffer();
}
