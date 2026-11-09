import { data } from './data';

export interface Article {
  path: string;
  /** Topic group on /kien-thuc. */
  group: string;
  /** Day the article was first published (written here, not taken from the data). */
  publishedAt: string;
  title: string;
  h1: string;
  description: string;
}

export const KB_PATH = '/kien-thuc';
export const KB_INDEX = {
  path: KB_PATH,
  title: 'Kiến thức biển số xe: sáp nhập 2025 và cách đọc mã',
  h1: 'Kiến thức về biển số xe',
  description: 'Kiến thức biển số xe có dẫn nguồn: sáp nhập tỉnh 2025, cách đọc mã, màu biển và seri, biển số định danh, đổi biển và đấu giá biển số.',
};
export const ARTICLE_SAPNHAP: Article = {
  group: 'Sáp nhập 2025',
  path: '/kien-thuc/bien-so-xe-sau-sap-nhap-2025',
  publishedAt: '2026-11-09',
  title: 'Biển số xe sau sáp nhập 2025 thay đổi thế nào?',
  h1: 'Biển số xe sau sáp nhập 2025 thay đổi thế nào?',
  description: 'Từ 01/07/2025 cả nước còn 34 tỉnh, thành và bảng ký hiệu biển số xe mới. Tỉnh cũ, tỉnh hiện hành, biển đã cấp, có dẫn nguồn văn bản.',
};
export const ARTICLE_DOCMA: Article = {
  group: 'Đọc biển số',
  path: '/kien-thuc/cach-doc-ma-bien-so-xe',
  publishedAt: '2026-11-09',
  title: 'Cách đọc 2 số đầu biển số xe để biết tỉnh đăng ký',
  h1: 'Cách đọc hai chữ số đầu biển số xe',
  description: 'Hai chữ số đầu biển số xe là ký hiệu địa phương đăng ký xe. Cách tra, ví dụ thật từ bảng mã và những điều mã biển không cho biết.',
};
export const ARTICLE_BANGDOICHIEU: Article = {
  group: 'Sáp nhập 2025',
  path: '/kien-thuc/bang-doi-chieu-63-tinh-cu-34-tinh-moi',
  publishedAt: '2026-11-09',
  title: 'Bảng đối chiếu 63 tỉnh cũ và 34 tỉnh, thành hiện nay',
  h1: 'Bảng đối chiếu 63 tỉnh cũ sang 34 tỉnh, thành hiện nay',
  description: 'Tra tỉnh cũ nay thuộc tỉnh, thành nào sau sáp nhập 2025, kèm mã biển số của tỉnh cũ. Đủ 63 dòng theo Nghị quyết 202/2025/QH15.',
};
export const ARTICLE_GIUNGUYEN: Article = {
  group: 'Sáp nhập 2025',
  path: '/kien-thuc/tinh-thanh-giu-nguyen-sau-sap-nhap-2025',
  publishedAt: '2026-11-09',
  title: 'Tỉnh nào giữ nguyên, tỉnh nào hợp nhất sau sáp nhập 2025?',
  h1: 'Tỉnh, thành nào giữ nguyên và tỉnh nào hợp nhất sau sáp nhập 2025?',
  description: '11 tỉnh, thành giữ nguyên, 6 tỉnh, thành hợp nhất từ 3 đơn vị và 17 tỉnh, thành hợp nhất từ 2 đơn vị sau sáp nhập 2025, kèm mã biển số.',
};
export const ARTICLE_NHIEUMA: Article = {
  group: 'Đọc biển số',
  path: '/kien-thuc/tinh-co-nhieu-ma-bien-so',
  publishedAt: '2026-11-09',
  title: 'Tỉnh có nhiều mã biển số: cách tra để không nhầm',
  h1: 'Một tỉnh có nhiều mã biển số: cách tra để không nhầm',
  description: 'Những tỉnh, thành dùng từ 3 mã biển số trở lên, mã nào của tỉnh từ trước 01/07/2025, mã nào đến từ tỉnh cũ hợp nhất, và cách tra.',
};
const V12_DATE = '2026-11-09';
export const ARTICLE_MAU: Article = {
  group: 'Đọc biển số',
  path: '/kien-thuc/mau-bien-so-xe',
  publishedAt: V12_DATE,
  title: 'Màu biển số xe: biển xanh, trắng, vàng là xe gì?',
  h1: 'Màu biển số xe: biển xanh, biển trắng, biển vàng là xe gì?',
  description: 'Biển số nền xanh, nền trắng, nền vàng dùng cho loại xe nào theo Thông tư 79/2024/TT-BCA, kèm tem biển đấu giá và số biển gắn trên mỗi xe.',
};
export const ARTICLE_SERI: Article = {
  group: 'Đọc biển số',
  path: '/kien-thuc/ky-hieu-seri-bien-so-xe',
  publishedAt: V12_DATE,
  title: 'Ký hiệu seri biển số xe: biển 2 chữ cái, CD, RM, HC, KT',
  h1: 'Ký hiệu seri trên biển số xe: biển 2 chữ cái, CD, RM, HC, KT là gì?',
  description: 'Seri trên biển số xe gồm mấy chữ: ô tô, mô tô, biển 2 chữ cái và các seri riêng CD, RM, HC, KT theo Thông tư 79/2024/TT-BCA, có dẫn nguồn.',
};
export const ARTICLE_NGQT: Article = {
  group: 'Đọc biển số',
  path: '/kien-thuc/bien-so-ng-qt-cv-nn',
  publishedAt: V12_DATE,
  title: 'Biển số NG, QT, CV, NN là xe gì? (biển xe nước ngoài)',
  h1: 'Biển số NG, QT, CV, NN là xe gì?',
  description: 'Biển số NG, QT, CV, NN dùng cho tổ chức, cá nhân nước ngoài nào, màu nền và màu chữ ra sao theo Thông tư 79/2024/TT-BCA, có dẫn nguồn.',
};
export const ARTICLE_DINHDANH: Article = {
  group: 'Thủ tục và đấu giá',
  path: '/kien-thuc/bien-so-dinh-danh',
  publishedAt: V12_DATE,
  title: 'Biển số định danh là gì? Bán xe có mất biển không?',
  h1: 'Biển số định danh là gì và bán xe có mất biển không?',
  description: 'Biển số định danh gắn với mã định danh của chủ xe. Khi bán xe, số biển được giữ cho chủ xe trong 5 năm. Giải thích theo Thông tư 79/2024/TT-BCA.',
};
export const ARTICLE_DOIBIEN: Article = {
  group: 'Thủ tục và đấu giá',
  path: '/kien-thuc/khi-nao-phai-doi-bien-so-xe',
  publishedAt: V12_DATE,
  title: 'Khi nào phải đổi biển số xe? Chuyển tỉnh có phải đổi?',
  h1: 'Khi nào phải đổi biển số xe? Chuyển tỉnh có phải đổi không?',
  description: 'Sáu trường hợp đổi chứng nhận đăng ký, biển số theo Điều 18 Thông tư 79/2024/TT-BCA, chuyển nơi cư trú và sáp nhập tỉnh có phải đổi biển không.',
};
export const ARTICLE_BIEN34: Article = {
  group: 'Thủ tục và đấu giá',
  path: '/kien-thuc/bien-so-3-so-4-so-con-dung-duoc-khong',
  publishedAt: V12_DATE,
  title: 'Biển số 3 số, 4 số còn dùng được không?',
  h1: 'Biển số 3 số, 4 số còn dùng được không?',
  description: 'Xe biển 3 số, 4 số hoặc biển 5 số ký hiệu cũ vẫn được tham gia giao thông; khi nào đổi sang biển mới theo Điều 39 Thông tư 79/2024/TT-BCA.',
};
export const ARTICLE_DAUGIA: Article = {
  group: 'Thủ tục và đấu giá',
  path: '/kien-thuc/dau-gia-bien-so-xe',
  publishedAt: V12_DATE,
  title: 'Đấu giá biển số xe: giá khởi điểm, đặt trước, thời hạn',
  h1: 'Đấu giá biển số xe: giá khởi điểm, tiền đặt trước và thời hạn',
  description: 'Đấu giá biển số xe theo Nghị định 156/2024/NĐ-CP: giá khởi điểm 40 triệu, 5 triệu, tiền đặt trước, bước giá, hạn nộp tiền 30 ngày, hạn đăng ký xe 12 tháng.',
};
/** Declared order = display order inside each group (all dated the same day). */
export const ARTICLES = [
  ARTICLE_SAPNHAP, ARTICLE_BANGDOICHIEU, ARTICLE_GIUNGUYEN,
  ARTICLE_DOCMA, ARTICLE_MAU, ARTICLE_SERI, ARTICLE_NGQT, ARTICLE_NHIEUMA,
  ARTICLE_DINHDANH, ARTICLE_DOIBIEN, ARTICLE_BIEN34, ARTICLE_DAUGIA,
];
export const GROUP_ORDER = ['Sáp nhập 2025', 'Đọc biển số', 'Thủ tục và đấu giá'];

/** Articles by topic group (GROUP_ORDER), newest first inside a group. */
export function articleGroups(list: Article[] = ARTICLES): { title: string; items: Article[] }[] {
  return GROUP_ORDER.map((title) => ({ title, items: articlesByDate(list.filter((a) => a.group === title)) })).filter((g) => g.items.length > 0);
}

/** Newest first; articles with the same date keep their declared order. */
export function articlesByDate(list: Article[] = ARTICLES): Article[] {
  return list.map((a, i) => ({ a, i })).sort((x, y) => (x.a.publishedAt === y.a.publishedAt ? x.i - y.i : x.a.publishedAt < y.a.publishedAt ? 1 : -1)).map((x) => x.a);
}

/** datePublished = publishedAt; dateModified = the later of publishedAt and meta.lastReviewed (ISO dates compare as strings). */
export function articleDates(a: Article, lastReviewed: string = data.meta.lastReviewed) {
  const modified = a.publishedAt > lastReviewed ? a.publishedAt : lastReviewed;
  return { published: a.publishedAt, modified, showModified: modified !== a.publishedAt };
}
