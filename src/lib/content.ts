import nq202 from '../../data/sources/nq202-2025.json';
import tt51 from '../../data/sources/tt51-2025-phu-luc-02.json';
import tt79 from '../../data/sources/tt79-2024-phu-luc-02.json';
import { SOURCE_NAME } from './copy';
import { data, type Province } from './data';
import { formatDate, joinVi } from './format';
import { createLookup, type LookupResult } from './lookup';

// Every sentence here is generated from data/plate-codes.json or data/sources/*.json. No legal claim is added.

type Found = Extract<LookupResult, { kind: 'province' | 'special' }>;
const same = (a: string, b: string) => a === b;
const codeList = (codes: string[]) => (codes.length <= 6 ? `${codes.length} mã: ${codes.join(', ')}` : `${codes.length} mã biển`);

/** Number of former (pre-merger) provincial units that appear in the data (63). */
export const FORMER_COUNT = new Set(data.codes.flatMap((c) => (c.type === 'province' ? [c.formerProvince] : []))).size;
export const MERGED_COUNT = data.provinces.filter((p) => p.mergedFrom.length > 0).length;
export const UNCHANGED_COUNT = data.provinces.length - MERGED_COUNT;
export const REVIEW_YEAR = data.meta.lastReviewed.slice(0, 4);

/**
 * 1–3 short sentences under the result card of /[code]; differs by case. Sentences that several pages of one
 * province would share start with "Mã {code}", so no long run of words is identical across many code pages.
 */
export function codeFacts(r: Found): string[] {
  if (r.kind === 'special') return [];
  const { province: p, code, former, changed, siblings } = r;
  const since = formatDate(data.meta.dataVersion);
  const out: string[] = [];
  const others = p.mergedFrom.filter((n) => !same(n, p.name) && !same(n, former));
  const count = p.codes.length <= 6 ? `${p.name} hiện dùng ${codeList(p.codes)}.` : `Mã ${code} là một trong ${p.codes.length} mã biển của ${p.name}.`;
  if (changed) {
    out.push(`Trước ${since}, mã ${code} là của ${former}. ${former} nay thuộc ${p.name}${others.length ? `, cùng với ${joinVi(others)}` : ''}.`);
    if (siblings.length > 0) out.push(count);
  } else if (p.mergedFrom.length > 0) {
    // The explanation under "Giải thích ngắn" already says the code stays with the province; here only the code count.
    out.push(siblings.length > 0 ? count : `Mã ${code} không đổi tỉnh: trước ${since} đã là của ${p.name}.`);
  } else {
    out.push(`${p.name} không thay đổi sau sắp xếp hành chính 2025 và ${siblings.length === 0 ? `chỉ dùng mã ${code}` : `dùng ${codeList(p.codes)}`}.`);
  }
  return out;
}

/** One summary sentence for /tinh/[slug]. */
export function provinceSummary(p: Province): string {
  const lookup = createLookup(data);
  const moved = p.codes.filter((c) => { const r = lookup(c); return r.kind === 'province' && r.changed; }).length;
  const since = formatDate(data.meta.dataVersion);
  if (p.mergedFrom.length === 0) return `${p.name} dùng ${codeList(p.codes)}, không đổi so với trước ${since}.`;
  return `${p.name} hiện dùng ${codeList(p.codes)}${moved > 0 ? `, trong đó ${moved} mã trước ${since} thuộc tỉnh khác` : ''}.`;
}

/** Name Phụ lục 02 gives to code 80. */
export const special80 = tt51.special.find((s) => s.codes.includes('80'))?.name ?? '';

/** /80: the direct answer, from the appendix itself. */
export function specialAnswer(code: string): string | null {
  const u = tt51.special.find((s) => s.codes.includes(code));
  return u ? `Biển số ${code} không thuộc tỉnh nào. Theo ${SOURCE_NAME}, ký hiệu ${code} dành cho ${u.name}.` : null;
}

export interface SourceDoc {
  name: string;
  links: { label: string; url: string }[];
}

/** Documents behind the data, with URLs taken from data/sources/*.json meta. */
export const SOURCE_DOCS: SourceDoc[] = [
  {
    name: 'Thông tư 51/2025/TT-BCA, Phụ lục số 02 (ký hiệu biển số xe, hiệu lực từ 01/07/2025)',
    links: [
      { label: 'Công báo số 887 + 888', url: tt51.meta.gazetteUrl },
      { label: 'Toàn văn trên Thư Viện Pháp Luật', url: tt51.meta.transcribedFrom },
    ],
  },
  {
    name: 'Nghị quyết 202/2025/QH15 về sắp xếp đơn vị hành chính cấp tỉnh',
    links: [{ label: 'Bản PDF', url: nq202.meta.pdf }],
  },
  {
    name: 'Thông tư 79/2024/TT-BCA, Phụ lục số 02 (bảng ký hiệu trước 01/07/2025, dùng cho tỉnh cũ)',
    links: [{ label: 'Toàn văn trên LuatVietnam', url: tt79.meta.transcribedFrom }],
  },
];

export const SOURCE_DATES = { nq202Adopted: formatDate(nq202.meta.adopted), nq202Effective: formatDate(nq202.meta.effective), governmentsFrom: formatDate(nq202.meta.newGovernmentsFrom) };

// ---- Tables for /kien-thuc articles (all generated from data/plate-codes.json) ----
const vi = (a: string, b: string) => a.localeCompare(b, 'vi');
const lookupAll = createLookup(data);

export interface MergeRow {
  former: string;
  province: Province;
  codes: string[];
}

/** One row per former province (63): the current province and the codes the former province had. Grouped by current province. */
export function mergeRows(): MergeRow[] {
  const map = new Map<string, MergeRow>();
  for (const c of data.codes) {
    if (c.type !== 'province') continue;
    const r = lookupAll(c.code);
    if (r.kind !== 'province') continue;
    const key = `${r.province.slug}|${c.formerProvince}`;
    const row = map.get(key) ?? { former: c.formerProvince, province: r.province, codes: [] };
    row.codes.push(c.code);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => vi(a.province.name, b.province.name) || vi(a.former, b.former));
}

/** Provinces grouped by how they were affected by NQ 202/2025/QH15. */
export function provinceGroups() {
  const by = (n: number) => data.provinces.filter((p) => p.mergedFrom.length === n).sort((a, b) => vi(a.name, b.name));
  return { unchanged: by(0), from2: by(2), from3: by(3) };
}

export interface MultiCodeRow {
  province: Province;
  own: string[];
  incoming: { code: string; former: string }[];
}

/** Provinces with ≥ 3 codes; "own" = codes whose former province carries the same name, "incoming" = codes of other former provinces. */
export function multiCodeProvinces(min = 3): MultiCodeRow[] {
  return data.provinces
    .filter((p) => p.codes.length >= min)
    .map((p) => {
      const own: string[] = [];
      const incoming: { code: string; former: string }[] = [];
      for (const code of p.codes) {
        const r = lookupAll(code);
        if (r.kind !== 'province') continue;
        if (r.changed) incoming.push({ code, former: r.former });
        else own.push(code);
      }
      return { province: p, own, incoming };
    })
    .sort((a, b) => b.province.codes.length - a.province.codes.length || vi(a.province.name, b.province.name));
}
