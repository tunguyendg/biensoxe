export type PlateKind = 'code' | 'letters' | 'empty' | 'invalid';

export interface ParsedPlate {
  kind: PlateKind;
  /** Two-digit code, only when kind === 'code'. */
  code?: string;
  raw: string;
}

/**
 * Parse free-form user input into a province code.
 * - Case/space/`-`/`.` insensitive; full-width digits are normalised (NFKC).
 * - Digits first  → 'code' with the leading 2 digits (a single digit is 'invalid').
 * - Letters first → 'letters' (NG/NN/QT, military series…): never guess a province.
 */
export function parsePlate(input: string): ParsedPlate {
  const raw = input;
  const s = input.normalize('NFKC').toUpperCase().replace(/[\s.\-_]+/g, '');
  if (s === '') return { kind: 'empty', raw };
  const m = /^(\d{2})/.exec(s);
  if (m) return { kind: 'code', code: m[1] as string, raw };
  if (/^\p{L}/u.test(s)) return { kind: 'letters', raw };
  return { kind: 'invalid', raw };
}
