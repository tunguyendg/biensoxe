import { data } from './data';
import { formatDate } from './format';

export interface Faq {
  q: string;
  a: string;
  /** Row(s) of data/SOURCES.md this answer is drawn from. */
  source: string;
}

const nq = data.meta.legalBasis.find((b) => b.id === 'nq202-2025');
const tt = data.meta.legalBasis.find((b) => b.id === 'tt51-2025');
const issued = (d?: { issued: string }) => (d ? formatDate(d.issued) : '');
const effective = (d?: { effective: string }) => (d ? formatDate(d.effective) : '');

/** 4–6 answers, each taken only from data/SOURCES.md. */
export const FAQ: Faq[] = [
  {
    q: 'Sau sáp nhập có bao nhiêu tỉnh, thành và mã biển được tính thế nào?',
    a: `Nghị quyết 202/2025/QH15 (ban hành ${issued(nq)}) sắp xếp 63 đơn vị hành chính cấp tỉnh thành 34. Bảng mã biển số theo 34 tỉnh, thành (kèm mã 80 của Cục CSGT) có hiệu lực từ ${effective(tt)} theo ${'Phụ lục 02 TT 51/2025/TT-BCA'}.`,
    source: 'Mục 1, 2',
  },
  {
    q: 'Một tỉnh có thể có nhiều mã biển không?',
    a: `Có. Bảng mã gồm ${data.codes.length} mã cho ${data.provinces.length} tỉnh, thành và mã 80, nên nhiều tỉnh có từ 2 mã trở lên. Trang của từng tỉnh liệt kê đủ các mã.`,
    source: 'Mục 1',
  },
  {
    q: 'Chuyển nơi cư trú sang tỉnh khác thì có phải đổi biển không?',
    a: 'Theo Thông tư 79/2024/TT-BCA (từ 01/01/2025), việc chuyển nơi cư trú sang tỉnh khác không, tự nó, buộc phải đổi biển. Đây là thông tin từ nguồn thứ cấp, chưa đối chiếu với văn bản gốc.',
    source: 'Mục 3',
  },
  {
    q: 'Biển cũ có bắt buộc phải đổi sau khi sáp nhập không?',
    a: 'Chưa thấy quy định bắt buộc đổi biển; hỏi công an nơi đăng ký để chắc chắn. Trang này không khẳng định biển cũ được giữ nguyên.',
    source: 'Mục 5 (chưa xác định)',
  },
  {
    q: 'Bảng mã có thay đổi sau này không?',
    a: 'Các thông tư sửa đổi sau đó (TT 37/2026/TT-BCA, TT 62/2026/TT-BCA) theo các bản tóm tắt pháp luật chúng tôi đã đọc không thay đổi bảng mã. Chúng tôi sẽ rà soát lại định kỳ.',
    source: 'Mục 6',
  },
  {
    q: 'Dữ liệu trên trang này đã được kiểm chứng chưa?',
    a: `Chưa hoàn toàn. Bảng mã được tổng hợp từ nguồn thứ cấp và đang chờ đối chiếu từng dòng với Phụ lục 02 TT 51/2025/TT-BCA. Lần kiểm tra gần nhất: ${formatDate(data.meta.lastReviewed)}.`,
    source: 'Mục 1; quy trình kiểm chứng',
  },
];
