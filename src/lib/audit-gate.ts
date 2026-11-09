import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** What the strict build needs to know about the last `npm run data:audit`. */
export interface AuditGate {
  /** SHA-256 of the current data/plate-codes.json. */
  currentSha: string;
  /** Parsed summary of data/audit-result.json; null when the file is missing. */
  audit: { dataSha256: string; mismatches: number; coverageIssues: number } | null;
}

/** Pure: reduce the audit-result.json document to the fields the gate needs. */
export function summariseAudit(doc: unknown): NonNullable<AuditGate['audit']> {
  const d = doc as { summary?: { dataSha256?: string; coverage?: unknown[] }; results?: { verdict?: string }[] };
  return {
    dataSha256: d.summary?.dataSha256 ?? '',
    mismatches: (d.results ?? []).filter((r) => r.verdict === 'MISMATCH').length,
    // A malformed file counts as an issue so it can never pass by accident.
    coverageIssues: Array.isArray(d.summary?.coverage) ? d.summary.coverage.length : 1,
  };
}

/** Reads data/plate-codes.json and data/audit-result.json from `root` (build time only). */
export function readAuditGate(root = '.'): AuditGate {
  const raw = readFileSync(join(root, 'data/plate-codes.json'), 'utf8');
  const file = join(root, 'data/audit-result.json');
  return {
    currentSha: createHash('sha256').update(raw).digest('hex'),
    audit: existsSync(file) ? summariseAudit(JSON.parse(readFileSync(file, 'utf8'))) : null,
  };
}
