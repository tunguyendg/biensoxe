// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// Mutation tests: break the data in a temp copy and prove `data:audit` fails. The real data is never touched.
interface Rec { codes: { code: string; type: string; currentProvince?: string; formerProvince?: string }[]; provinces: { slug: string }[] }
const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

function audit(mutate: (d: Rec) => void) {
  const root = mkdtempSync(join(tmpdir(), 'audit-'));
  dirs.push(root);
  mkdirSync(join(root, 'data'));
  cpSync('data/sources', join(root, 'data/sources'), { recursive: true });
  const d = JSON.parse(readFileSync('data/plate-codes.json', 'utf8')) as Rec;
  mutate(d);
  writeFileSync(join(root, 'data/plate-codes.json'), JSON.stringify(d, null, 2));
  const r = spawnSync(process.execPath, ['scripts/audit-data.mjs', '--root', root], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout + r.stderr, report: readFileSync(join(root, 'docs/DATA_AUDIT.md'), 'utf8') };
}
const code = (d: Rec, c: string) => d.codes.find((x) => x.code === c)!;

describe('data:audit mutation tests', () => {
  it('baseline (real data) passes with 0 MISMATCH', () => {
    const r = audit(() => {});
    expect(r.status).toBe(0);
    expect(r.out).toContain('MISMATCH=0');
  });
  it('wrong former province for code 83 → fail', () => {
    const r = audit((d) => (code(d, '83').formerProvince = 'Hà Nội'));
    expect(r.status).toBe(1);
    expect(r.report).toMatch(/code:83.*MISMATCH/);
  });
  it('wrong current province for code 61 → fail', () => {
    const r = audit((d) => (code(d, '61').currentProvince = 'ha-noi'));
    expect(r.status).toBe(1);
    expect(r.report).toMatch(/code:61.*MISMATCH/);
  });
  it('code 97 removed → fail (coverage)', () => {
    const r = audit((d) => (d.codes = d.codes.filter((c) => c.code !== '97')));
    expect(r.status).toBe(1);
    expect(r.report).toContain('Thiếu mã 97');
  });
  it('code 80 assigned to a province → fail', () => {
    const r = audit((d) => (code(d, '80').currentProvince = 'ha-noi'));
    expect(r.status).toBe(1);
    expect(r.report).toMatch(/code:80.*MISMATCH/);
  });
});

describe('data:audit --check and write-only-on-change', () => {
  const run = (root: string, ...flags: string[]) => spawnSync(process.execPath, ['scripts/audit-data.mjs', ...flags, '--root', root], { encoding: 'utf8' });
  const fresh = () => {
    const root = mkdtempSync(join(tmpdir(), 'audit-'));
    dirs.push(root);
    mkdirSync(join(root, 'data'));
    cpSync('data/sources', join(root, 'data/sources'), { recursive: true });
    cpSync('data/plate-codes.json', join(root, 'data/plate-codes.json'));
    return root;
  };
  it('--check fails when the audit file is missing, passes after a write, and writes nothing itself', () => {
    const root = fresh();
    const missing = run(root, '--check');
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('npm run data:audit');
    expect(run(root).status).toBe(0);
    const before = readFileSync(join(root, 'data/audit-result.json'), 'utf8');
    expect(run(root, '--check').status).toBe(0);
    expect(readFileSync(join(root, 'data/audit-result.json'), 'utf8')).toBe(before);
  });
  it('re-running without changes rewrites nothing (auditedAt is ignored)', () => {
    const root = fresh();
    run(root);
    const a = [readFileSync(join(root, 'data/audit-result.json'), 'utf8'), readFileSync(join(root, 'docs/DATA_AUDIT.md'), 'utf8')];
    run(root);
    run(root, '--check');
    expect([readFileSync(join(root, 'data/audit-result.json'), 'utf8'), readFileSync(join(root, 'docs/DATA_AUDIT.md'), 'utf8')]).toEqual(a);
  });
  it('changing one record makes --check fail because the stored hash is old', () => {
    const root = fresh();
    run(root);
    const f = join(root, 'data/plate-codes.json');
    const d = JSON.parse(readFileSync(f, 'utf8')) as { provinces: { verified: boolean }[] };
    d.provinces[0]!.verified = true; // harmless for the audit verdict, but the sha changes
    writeFileSync(f, JSON.stringify(d, null, 2));
    const r = run(root, '--check');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('dataSha256');
    expect(r.stderr).toContain('npm run data:audit');
  });
});
