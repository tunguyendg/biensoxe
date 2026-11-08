import raw from '../../data/plate-codes.json';

export type Region = 'bac' | 'trung' | 'nam';

export interface LegalBasis {
  id: string;
  title: string;
  issued: string;
  effective: string;
}

export interface Meta {
  dataVersion: string;
  lastReviewed: string;
  legalBasis: LegalBasis[];
  status: string;
}

export interface Province {
  slug: string;
  name: string;
  region: Region;
  codes: string[];
  formerProvinces: string[];
  verified: boolean;
}

export interface ProvinceCode {
  code: string;
  type: 'province';
  currentProvince: string;
  formerProvince: string;
  verified: boolean;
  note?: string;
}

export interface SpecialCode {
  code: string;
  type: 'special';
  currentProvince: null;
  formerProvince: null;
  label: string;
  verified: boolean;
  note?: string;
}

export type PlateCode = ProvinceCode | SpecialCode;

export interface PlateData {
  meta: Meta;
  provinces: Province[];
  codes: PlateCode[];
}

/** The single source of truth. Never hard-code codes or names elsewhere. */
export const data = raw as PlateData;

export function countUnverified(d: PlateData = data): number {
  return (
    d.provinces.filter((p) => !p.verified).length + d.codes.filter((c) => !c.verified).length
  );
}

/** True while any record is still unverified → site shows the "DỮ LIỆU NHÁP" banner. */
export function isDraft(d: PlateData = data): boolean {
  return countUnverified(d) > 0;
}
