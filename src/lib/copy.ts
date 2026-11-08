import { data } from './data';
import { formatDate } from './format';

/** The ONE limits sentence, used on every page. */
export const LIMITS = 'Mã biển chỉ cho biết nơi cấp biển. Không cho biết chủ xe là ai, đang sống ở đâu hay tình trạng của xe.';

export const SOURCE_NAME = 'Phụ lục 02 TT 51/2025/TT-BCA';

export const MERGER_DATE = () => formatDate(data.meta.dataVersion);

/** "Nguồn: … · bảng mã hiệu lực từ 01/07/2025 · kiểm tra lần cuối 08/11/2026." */
export function sourceText(): string {
  const { dataVersion, lastReviewed } = data.meta;
  return `Nguồn: ${SOURCE_NAME} · bảng mã hiệu lực từ ${formatDate(dataVersion)} · kiểm tra lần cuối ${formatDate(lastReviewed)}.`;
}

/** Small grey note appended to the source line while any record is unverified. */
export const DRAFT_NOTE = ' · đang đối chiếu bản gốc';
