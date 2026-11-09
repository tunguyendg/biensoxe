import { SOURCE_NAME } from './copy';
import { data, type Province } from './data';
import { REVIEW_YEAR } from './content';
import { formatDate, joinVi } from './format';
import type { LookupResult } from './lookup';

type Found = Extract<LookupResult, { kind: 'province' | 'special' }>;

export const TITLE_MAX = 60;
export const DESC_MIN = 120;
export const DESC_MAX = 160;

/** Start from the mandatory sentence, then append optional ones (in order) while they still fit in `max`, until `min` is reached. */
export function fitText(mandatory: string, extras: string[], min = DESC_MIN, max = DESC_MAX): string {
  let out = mandatory;
  for (const e of extras) {
    if (out.length >= min) break;
    const next = `${out} ${e}`;
    if (next.length <= max) out = next;
  }
  return out;
}

const firstFitting = (options: string[]): string => options.find((o) => o.length <= TITLE_MAX) ?? (options[options.length - 1] as string);
const codeList = (codes: string[]) => (codes.length <= 5 ? `${codes.length} mã biển: ${codes.join(', ')}.` : `${codes.length} mã biển.`);

/** <title> for /[code]; shortens gracefully so it stays ≤ 60 characters. */
export function codeTitle(r: Found): string {
  if (r.kind === 'special') return `Biển số ${r.code}: ${r.label}`;
  const n = r.province.name;
  if (!r.changed) return firstFitting([`Biển số ${r.code} là tỉnh nào? ${n}`, `Biển số ${r.code} là ${n}`]);
  return firstFitting([
    `Biển số ${r.code} là tỉnh nào? ${n} (trước là ${r.former})`,
    `Biển số ${r.code} là ${n} (trước là ${r.former})`,
    `Biển số ${r.code}: ${n} (trước ${r.former})`,
    `Biển số ${r.code} là ${n}`,
  ]);
}

export function codeDescription(r: Found): string {
  if (r.kind === 'special') {
    return fitText(`Mã biển số ${r.code} không gắn với tỉnh hay thành phố nào: ${r.label}.`, [
      'Xem bảng mã đầy đủ theo tỉnh, thành, nguồn và giới hạn của mã biển.',
      `Bảng mã hiệu lực từ ${formatDate(data.meta.dataVersion)}.`,
    ]);
  }
  const former = r.changed ? `, trước ${formatDate(data.meta.dataVersion)} là ${r.former}` : '';
  return fitText(`Biển số ${r.code} là xe đăng ký tại ${r.province.name}${former}.`, [
    `${r.province.name} có ${codeList(r.province.codes)}`,
    'Xem các mã khác cùng tỉnh, nguồn và giới hạn của mã biển.',
    `Bảng mã hiệu lực từ ${formatDate(data.meta.dataVersion)}.`,
    'Tra cứu ngay trên trình duyệt, không lưu biển số của bạn.',
  ]);
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
  // Written per province, from the data. Pages of one province must not share long identical runs, so the
  // same-name case repeats the code mid-sentence.
  const merger = r.changed
    ? `${r.former} được hợp nhất vào ${r.province.name} theo Nghị quyết 202/2025/QH15.`
    : r.province.mergedFrom.length > 0
      ? `Mã ${r.code} vẫn thuộc ${r.province.name} như trước ${formatDate(data.meta.dataVersion)}.`
      : mergerSentence(r.province);
  const former = r.changed ? ` Trước ${formatDate(data.meta.dataVersion)}, mã này thuộc ${r.former}.` : '';
  return `Biển ${r.code} là xe đăng ký tại ${r.province.name}.${former} ${merger}`;
}

export function provinceTitle(p: Province): string {
  return firstFitting([`Biển số xe ${p.name}: các mã ${p.codes.join(', ')}`, `Biển số xe ${p.name} (${p.codes.length} mã biển)`]);
}

export function provinceDescription(p: Province): string {
  const list = p.codes.length <= 5 ? `${p.codes.length} mã: ${p.codes.join(', ')}.` : `${p.codes.length} mã biển.`;
  return fitText(`Biển số xe ${p.name} gồm ${list}`, [
    mergerSentence(p),
    'Mỗi mã có trang riêng, kèm tỉnh trước sáp nhập, nguồn và giới hạn.',
    `Bảng mã hiệu lực từ ${formatDate(data.meta.dataVersion)}.`,
  ]);
}

export const HOME_TITLE = 'Biển số xe là tỉnh nào? Tra cứu mã biển số sau sáp nhập';
export const HOME_DESC =
  'Gõ 2 số đầu của biển để biết xe đăng ký ở tỉnh, thành nào sau sáp nhập 01/07/2025 và tỉnh trước đây. Có nguồn, có nói rõ giới hạn.';
export const BANGMA_H1 = `Bảng biển số xe ${data.provinces.length} tỉnh thành`;
export const BANGMA_TITLE = `${BANGMA_H1} (cập nhật ${REVIEW_YEAR})`;
export const BANGMA_DESC =
  'Bảng đầy đủ mã biển số xe theo 34 tỉnh, thành sau sáp nhập 01/07/2025, chia theo vùng, kèm tỉnh trước đây. Lọc nhanh theo mã hoặc tên tỉnh.';
export const NGUON_TITLE = 'Nguồn và giới hạn của dữ liệu biển số xe';
export const NGUON_DESC =
  'Căn cứ pháp lý của bảng mã biển số xe, biển số cho biết và không cho biết gì, câu hỏi thường gặp, ngày kiểm tra dữ liệu và thông tin về quảng cáo.';
export const NOTFOUND_TITLE = 'Không tìm thấy trang — Biển Số';
export const NOTFOUND_DESC =
  'Trang bạn tìm không tồn tại hoặc mã biển chưa được cấp cho tỉnh nào. Nhập 2 số đầu của biển để tra lại hoặc xem bảng mã biển số xe đầy đủ.';
