import { countUnverified, type PlateData } from './data';

/** Throws when strict mode is on and any record is still `verified:false`. */
export function assertStrictBuild(d: PlateData, flag: string | undefined): void {
  if (flag !== '1') return;
  const n = countUnverified(d);
  if (n > 0) {
    throw new Error(
      `BIEN_SO_STRICT=1: ${n} record(s) in data/plate-codes.json still have verified:false. ` +
        'The Founder must verify them against Phụ lục 02 TT 51/2025/TT-BCA before a production build.',
    );
  }
}
