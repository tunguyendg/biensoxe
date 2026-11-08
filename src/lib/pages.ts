import { SOURCE_NAME } from './copy';
import { data, type Province } from './data';
import { formatDate, joinVi } from './format';
import type { LookupResult } from './lookup';

type Found = Extract<LookupResult, { kind: 'province' | 'special' }>;

/** <title> for /[code]. */
export function codeTitle(r: Found): string {
  if (r.kind === 'special') return `Biển số ${r.code}: ${r.label}`;
  const base = `Biển số ${r.code} là tỉnh nào? ${r.province.name}`;
  return r.changed ? `${base} (trước là ${r.former})` : base;
}

export function codeDescription(r: Found): string {
  if (r.kind === 'special') return `Mã biển số ${r.code} không gắn với tỉnh hay thành phố nào: ${r.label}.`;
  const former = r.changed ? `, trước ${formatDate(data.meta.dataVersion)} là ${r.former}` : '';
  return `Biển số ${r.code} là xe đăng ký tại ${r.province.name}${former}. Xem các mã khác cùng tỉnh và nguồn.`;
}

/** One plain sentence about the merger (NQ 202/2025/QH15). */
export function mergerSentence(p: Province): string {
  return p.mergedFrom.length > 0
    ? `Từ ${formatDate(data.meta.dataVersion)}, ${joinVi(p.mergedFrom)} hợp nhất thành ${p.name} theo Nghị quyết 202/2025/QH15.`
    : `${p.name} không thuộc diện sắp xếp theo Nghị quyết 202/2025/QH15, nên vẫn giữ nguyên.`;
}

/** Short explanation paragraph under the card on /[code]. */
export function codeExplanation(r: Found): string {
  if (r.kind === 'special') {
    return `Mã ${r.code} không gắn với tỉnh hay thành phố nào. Theo bảng mã (${SOURCE_NAME}), đây là mã của ${r.label}.`;
  }
  const former = r.changed ? ` Trước ${formatDate(data.meta.dataVersion)}, mã này thuộc ${r.former}.` : '';
  return `Biển ${r.code} là xe đăng ký tại ${r.province.name}.${former} ${mergerSentence(r.province)}`;
}

export function provinceTitle(p: Province): string {
  return `Biển số xe ${p.name}: các mã ${p.codes.join(', ')}`;
}

export function provinceDescription(p: Province): string {
  return `${p.name} dùng ${p.codes.length} mã biển số: ${p.codes.join(', ')}. ${mergerSentence(p)}`;
}
