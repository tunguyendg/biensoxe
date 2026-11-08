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
  /** All former units merged into this one, incl. the one that kept the name. [] = unchanged. (NQ 202/2025/QH15) */
  mergedFrom: string[];
  /** Political-administrative centre. null = not stated in NQ 202. */
  adminCenter: string | null;
  areaKm2: number | null;
  population: number | null;
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

/** True while any record is still unverified → noindex + the small "đang đối chiếu bản gốc" source note. */
export function isDraft(d: PlateData = data): boolean {
  return countUnverified(d) > 0;
}

/** <meta name="robots"> value: drafts are never indexed. */
export function robotsContent(draft: boolean = isDraft()): string {
  return draft ? 'noindex,follow' : 'index,follow';
}
