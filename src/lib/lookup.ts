import { data as defaultData, type PlateData, type Province } from './data';

export type LookupResult =
  | {
      kind: 'province';
      code: string;
      province: Province;
      /** Province name before 01/07/2025 (may equal the current name). */
      former: string;
      /** True when the former name differs from the current one. */
      changed: boolean;
      /** Other codes of the same province, in data order. */
      siblings: string[];
    }
  | { kind: 'special'; code: string; label: string; note?: string }
  | { kind: 'unknown'; code: string };

export function createLookup(d: PlateData) {
  const codes = new Map(d.codes.map((c) => [c.code, c]));
  const provinces = new Map(d.provinces.map((p) => [p.slug, p]));

  return function lookup(code: string): LookupResult {
    const rec = codes.get(code);
    if (!rec) return { kind: 'unknown', code };
    if (rec.type === 'special') {
      return rec.note === undefined
        ? { kind: 'special', code, label: rec.label }
        : { kind: 'special', code, label: rec.label, note: rec.note };
    }
    const province = provinces.get(rec.currentProvince);
    if (!province) throw new Error(`Code ${code} points to missing province "${rec.currentProvince}"`);
    return {
      kind: 'province',
      code,
      province,
      former: rec.formerProvince,
      changed: rec.formerProvince !== province.name,
      siblings: province.codes.filter((c) => c !== code),
    };
  };
}

export const lookup = createLookup(defaultData);
