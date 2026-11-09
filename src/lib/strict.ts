import type { AuditGate } from './audit-gate';
import { countUnverified, type PlateData } from './data';

/**
 * Production gate (BIEN_SO_STRICT=1). It may fail only for these reasons, reported together:
 * unverified records, a missing/non-https SITE_URL, or a data audit that is missing, stale
 * (its dataSha256 differs from the current plate-codes.json) or has MISMATCH/coverage issues.
 */
export function assertStrictBuild(d: PlateData, flag: string | undefined, siteUrl: string | undefined, gate: AuditGate): void {
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
  if (!gate.audit) {
    reasons.push('data/audit-result.json is missing (run npm run data:audit)');
  } else if (gate.audit.dataSha256 !== gate.currentSha) {
    reasons.push('data/audit-result.json is stale: its dataSha256 differs from the current data/plate-codes.json (re-run npm run data:audit)');
  } else if (gate.audit.mismatches > 0 || gate.audit.coverageIssues > 0) {
    reasons.push(`the data audit reports ${gate.audit.mismatches} MISMATCH and ${gate.audit.coverageIssues} coverage issue(s) (see docs/DATA_AUDIT.md)`);
  }
  if (reasons.length > 0) throw new Error(`BIEN_SO_STRICT=1 build blocked:\n - ${reasons.join('\n - ')}`);
}
