import { describe, expect, it } from 'vitest';
import { data, type PlateData } from '../src/lib/data';
import { createLookup, lookup } from '../src/lib/lookup';
import { parsePlate } from '../src/lib/parse';
import { formatDate } from '../src/lib/format';

describe('lookup: every one of the 81 codes', () => {
  it.each(data.codes.map((c) => [c.code, c] as const))('%s', (code, rec) => {
    const r = lookup(code);
    expect(r.code).toBe(code);
    if (rec.type === 'special') {
      expect(r).toMatchObject({ kind: 'special', label: rec.label });
      return;
    }
    expect(r.kind).toBe('province');
    if (r.kind !== 'province') return;
    expect(r.province.slug).toBe(rec.currentProvince);
    expect(r.former).toBe(rec.formerProvince);
    expect(r.changed).toBe(rec.formerProvince !== r.province.name);
    expect(r.siblings).not.toContain(code);
    expect([...r.siblings, code].sort()).toEqual([...r.province.codes].sort());
  });

  it('parse → lookup round-trips for every code via a realistic plate', () => {
    for (const c of data.codes) {
      const p = parsePlate(`${c.code}A-123.45`);
      expect(p.code).toBe(c.code);
      expect(lookup(p.code as string).kind).not.toBe('unknown');
    }
  });
});

describe('lookup: specific cases', () => {
  it('special code 80 has a label, no province, and its note', () => {
    const r = lookup('80');
    expect(r.kind).toBe('special');
    expect(r).toHaveProperty('note');
  });

  it('special code without a note omits the field', () => {
    const d: PlateData = structuredClone(data);
    const s = d.codes.find((c) => c.type === 'special');
    delete (s as { note?: string }).note;
    const r = createLookup(d)('80');
    expect(r).toEqual({ kind: 'special', code: '80', label: s && 'label' in s ? s.label : '' });
    expect('note' in r).toBe(false);
  });

  it.each(['13', '42', '87', '00', '10'])('unknown code %j', (code) => {
    expect(lookup(code)).toEqual({ kind: 'unknown', code });
  });

  it('merged province: 83 is Cần Thơ, formerly Sóc Trăng', () => {
    const r = lookup('83');
    expect(r).toMatchObject({ kind: 'province', former: 'Sóc Trăng', changed: true });
  });

  it('unchanged province: 29 Hà Nội has changed=false', () => {
    expect(lookup('29')).toMatchObject({ kind: 'province', former: 'Hà Nội', changed: false });
  });

  it('throws on a dangling province reference', () => {
    const d: PlateData = structuredClone(data);
    const c = d.codes.find((x) => x.type === 'province');
    if (c?.type === 'province') c.currentProvince = 'nope';
    expect(() => createLookup(d)(c?.code as string)).toThrow(/missing province/);
  });
});

describe('formatDate', () => {
  it('formats ISO to dd/mm/yyyy', () => {
    expect(formatDate('2025-07-01')).toBe('01/07/2025');
    expect(formatDate(data.meta.lastReviewed)).toBe('08/11/2026');
  });
});
