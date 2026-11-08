import { data, type Province, type Region } from './data';
import { formatDate } from './format';

const REGION_LABEL: Record<Region, string> = {
  bac: 'Miền Bắc',
  trung: 'Miền Trung & Tây Nguyên',
  nam: 'Miền Nam',
};

/** Badge under the "Trước 01/07/2025" line. */
export function mergeBadge(p: Province): { merged: boolean; text: string } {
  return p.mergedFrom.length === 0
    ? { merged: false, text: `Không thay đổi sau sáp nhập ${formatDate(data.meta.dataVersion)}` }
    : { merged: true, text: `Hợp nhất từ: ${p.mergedFrom.join(', ')}` };
}

/** "Trung tâm hành chính: … · Miền …"; the admin-centre part is dropped when null. */
export function metaLine(p: Province): string {
  const region = REGION_LABEL[p.region];
  return p.adminCenter === null ? region : `Trung tâm hành chính: ${p.adminCenter} · ${region}`;
}

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/** For /tinh/[slug] only. null parts are hidden; returns null when nothing is known. */
export function areaPopulationLine(p: Province): string | null {
  const parts: string[] = [];
  if (p.areaKm2 !== null) parts.push(`Diện tích: ${nf.format(p.areaKm2)} km²`);
  if (p.population !== null) parts.push(`Dân số: ${nf.format(p.population)} người`);
  return parts.length > 0 ? parts.join(' · ') : null;
}
