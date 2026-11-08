import { describe, expect, it } from 'vitest';
import { countUnverified, data, isDraft, type PlateData } from '../src/lib/data';
import { assertStrictBuild } from '../src/lib/strict';

const { provinces, codes } = data;
const provinceBySlug = new Map(provinces.map((p) => [p.slug, p]));

describe('data integrity', () => {
  it('has 81 unique codes, each 2 digits', () => {
    expect(codes).toHaveLength(81);
    expect(new Set(codes.map((c) => c.code)).size).toBe(81);
    for (const c of codes) expect(c.code).toMatch(/^\d{2}$/);
  });

  it('has 34 provinces (unique slugs) + exactly 1 special code', () => {
    expect(provinces).toHaveLength(34);
    expect(new Set(provinces.map((p) => p.slug)).size).toBe(34);
    const special = codes.filter((c) => c.type === 'special');
    expect(special.map((c) => c.code)).toEqual(['80']);
    expect(codes.filter((c) => c.type === 'province')).toHaveLength(80);
  });

  it('every province code exists and points back to its province', () => {
    const byCode = new Map(codes.map((c) => [c.code, c]));
    for (const p of provinces) {
      expect(p.codes.length, p.slug).toBeGreaterThan(0);
      for (const code of p.codes) {
        const rec = byCode.get(code);
        expect(rec, `${p.slug}:${code}`).toBeDefined();
        expect(rec?.currentProvince, `${p.slug}:${code}`).toBe(p.slug);
      }
    }
  });

  it('every province-type code is listed by exactly the province it points to', () => {
    const listed = provinces.flatMap((p) => p.codes);
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.sort()).toEqual(
      codes
        .filter((c) => c.type === 'province')
        .map((c) => c.code)
        .sort(),
    );
    for (const c of codes) {
      if (c.type === 'province') expect(provinceBySlug.has(c.currentProvince), c.code).toBe(true);
    }
  });

  it('has 63 distinct former units', () => {
    const former = codes.flatMap((c) => (c.formerProvince ? [c.formerProvince] : []));
    expect(new Set(former).size).toBe(63);
  });

  it('has no empty names', () => {
    for (const p of provinces) {
      expect(p.name.trim(), p.slug).not.toBe('');
      expect(p.slug.trim()).not.toBe('');
      for (const f of p.formerProvinces) expect(f.trim()).not.toBe('');
    }
    for (const c of codes) {
      if (c.type === 'province') expect(c.formerProvince.trim(), c.code).not.toBe('');
      else expect(c.label.trim(), c.code).not.toBe('');
    }
  });
});

describe('strict gate', () => {
  const clone = (): PlateData => structuredClone(data);

  it('the shipped draft data is flagged as draft', () => {
    expect(isDraft()).toBe(true);
    expect(countUnverified()).toBeGreaterThan(0);
  });

  it('is a no-op when the flag is not "1"', () => {
    expect(() => assertStrictBuild(data, undefined)).not.toThrow();
    expect(() => assertStrictBuild(data, '0')).not.toThrow();
  });

  it('throws under BIEN_SO_STRICT=1 while any record is unverified', () => {
    expect(() => assertStrictBuild(data, '1')).toThrow(/verified:false/);
  });

  it('passes under strict once everything is verified', () => {
    const d = clone();
    d.provinces.forEach((p) => (p.verified = true));
    d.codes.forEach((c) => (c.verified = true));
    expect(() => assertStrictBuild(d, '1')).not.toThrow();
    expect(isDraft(d)).toBe(false);
  });

  it('a single unverified code is enough to fail strict', () => {
    const d = clone();
    d.provinces.forEach((p) => (p.verified = true));
    d.codes.forEach((c) => (c.verified = true));
    d.codes[0]!.verified = false;
    expect(() => assertStrictBuild(d, '1')).toThrow();
  });
});
