import tt51 from '../../data/sources/tt51-2025-phu-luc-02.json';

export type Decisions = Record<string, string>;
export interface AppendixUnit {
  name: string;
  codes: string[];
}

// data/DECISIONS.json is written by the Founder; it may not exist yet.
const files = import.meta.glob<Decisions>('../../data/DECISIONS.json', { eager: true, import: 'default' });
export const decisions: Decisions = Object.values(files)[0] ?? {};

/**
 * Small note for pages whose displayed name differs from the name Phụ lục 02 TT 51/2025/TT-BCA uses
 * (e.g. "Huế" vs "Thừa Thiên Huế"). Only shown once the Founder has recorded a decision for `key`
 * ("code:75" / "province:hue"). The appendix name is read from data/sources, never hard-coded.
 */
export function appendixNameNote(
  key: string,
  displayName: string,
  codes: string[],
  decided: Decisions = decisions,
  units: AppendixUnit[] = tt51.units,
): string | null {
  if (!decided[key]) return null;
  const unit = units.find((u) => codes.some((c) => u.codes.includes(c)));
  if (!unit || unit.name === displayName) return null;
  return `Phụ lục 02 TT 51/2025/TT-BCA ghi tên địa phương là '${unit.name}'.`;
}
