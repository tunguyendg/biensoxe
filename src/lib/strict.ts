import { countUnverified, type PlateData } from './data';

/**
 * Production gate (BIEN_SO_STRICT=1). It may fail for exactly two reasons, reported together:
 * unverified records, or a missing/non-https SITE_URL.
 */
export function assertStrictBuild(d: PlateData, flag: string | undefined, siteUrl?: string): void {
  if (flag !== '1') return;
  const reasons: string[] = [];
  const n = countUnverified(d);
  if (n > 0) {
    reasons.push(
      `${n} record(s) in data/plate-codes.json still have verified:false (the Founder must check them against Phụ lục 02 TT 51/2025/TT-BCA)`,
    );
  }
  if (!siteUrl || !siteUrl.startsWith('https://')) {
    reasons.push('SITE_URL is not set to the final https:// origin (used for canonical URLs and the sitemap)');
  }
  if (reasons.length > 0) throw new Error(`BIEN_SO_STRICT=1 build blocked:\n - ${reasons.join('\n - ')}`);
}
