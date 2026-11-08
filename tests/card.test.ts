import { describe, expect, it } from 'vitest';
import { SHOW_AREA_POPULATION, areaPopulationLine, mergeBadge, metaLine } from '../src/lib/card';
import { data, type Province } from '../src/lib/data';

const by = (slug: string) => data.provinces.find((p) => p.slug === slug) as Province;

describe('card helpers', () => {
  it('area & population stay hidden on every page until all 34 provinces have a source', () => {
    expect(SHOW_AREA_POPULATION).toBe(false);
  });
  it('unchanged province gets the "Không thay đổi" badge', () => {
    expect(mergeBadge(by('ha-noi'))).toEqual({ merged: false, text: 'Không thay đổi sau sáp nhập 01/07/2025' });
  });
  it('merged province lists all former units, including the one that kept the name', () => {
    expect(mergeBadge(by('can-tho'))).toEqual({ merged: true, text: 'Hợp nhất từ: Cần Thơ, Sóc Trăng, Hậu Giang' });
  });
  it('metaLine shows only the region: the admin centre is not part of the MVP, even if a value exists', () => {
    expect(metaLine(by('can-tho'))).toBe('Miền Nam');
    expect(metaLine({ ...by('can-tho'), adminCenter: 'X' })).toBe('Miền Nam');
    expect(metaLine(by('ha-noi'))).toBe('Miền Bắc');
    expect(metaLine(by('lam-dong'))).toBe('Miền Trung & Tây Nguyên');
  });
  it('area/population line: both, one, none', () => {
    expect(areaPopulationLine(by('can-tho'))).toBe('Diện tích: 6.360,83 km² · Dân số: 4.199.824 người');
    expect(areaPopulationLine({ ...by('can-tho'), areaKm2: null })).toBe('Dân số: 4.199.824 người');
    expect(areaPopulationLine({ ...by('can-tho'), population: null })).toBe('Diện tích: 6.360,83 km²');
    expect(areaPopulationLine(by('ha-noi'))).toBeNull();
  });
});
