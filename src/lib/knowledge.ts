import { data } from './data';

export interface Article {
  path: string;
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
  description: 'Hai bài ngắn, có dẫn nguồn: biển số xe thay đổi thế nào sau sáp nhập tỉnh 2025 và cách đọc hai chữ số đầu của biển số xe.',
};
export const ARTICLE_SAPNHAP: Article = {
  path: '/kien-thuc/bien-so-xe-sau-sap-nhap-2025',
  publishedAt: '2026-11-09',
  title: 'Biển số xe sau sáp nhập 2025 thay đổi thế nào?',
  h1: 'Biển số xe sau sáp nhập 2025 thay đổi thế nào?',
  description: 'Từ 01/07/2025 cả nước còn 34 tỉnh, thành và bảng ký hiệu biển số xe mới. Tỉnh cũ, tỉnh hiện hành, biển đã cấp, có dẫn nguồn văn bản.',
};
export const ARTICLE_DOCMA: Article = {
  path: '/kien-thuc/cach-doc-ma-bien-so-xe',
  publishedAt: '2026-11-09',
  title: 'Cách đọc 2 số đầu biển số xe để biết tỉnh đăng ký',
  h1: 'Cách đọc hai chữ số đầu biển số xe',
  description: 'Hai chữ số đầu biển số xe là ký hiệu địa phương đăng ký xe. Cách tra, ví dụ thật từ bảng mã và những điều mã biển không cho biết.',
};
export const ARTICLE_BANGDOICHIEU: Article = {
  path: '/kien-thuc/bang-doi-chieu-63-tinh-cu-34-tinh-moi',
  publishedAt: '2026-11-09',
  title: 'Bảng đối chiếu 63 tỉnh cũ và 34 tỉnh, thành hiện nay',
  h1: 'Bảng đối chiếu 63 tỉnh cũ sang 34 tỉnh, thành hiện nay',
  description: 'Tra tỉnh cũ nay thuộc tỉnh, thành nào sau sáp nhập 2025, kèm mã biển số của tỉnh cũ. Đủ 63 dòng theo Nghị quyết 202/2025/QH15.',
};
export const ARTICLE_GIUNGUYEN: Article = {
  path: '/kien-thuc/tinh-thanh-giu-nguyen-sau-sap-nhap-2025',
  publishedAt: '2026-11-09',
  title: 'Tỉnh nào giữ nguyên, tỉnh nào hợp nhất sau sáp nhập 2025?',
  h1: 'Tỉnh, thành nào giữ nguyên và tỉnh nào hợp nhất sau sáp nhập 2025?',
  description: '11 tỉnh, thành giữ nguyên, 6 tỉnh, thành hợp nhất từ 3 đơn vị và 17 tỉnh, thành hợp nhất từ 2 đơn vị sau sáp nhập 2025, kèm mã biển số.',
};
export const ARTICLE_NHIEUMA: Article = {
  path: '/kien-thuc/tinh-co-nhieu-ma-bien-so',
  publishedAt: '2026-11-09',
  title: 'Tỉnh có nhiều mã biển số: cách tra để không nhầm',
  h1: 'Một tỉnh có nhiều mã biển số: cách tra để không nhầm',
  description: 'Những tỉnh, thành dùng từ 3 mã biển số trở lên, mã nào của tỉnh từ trước 01/07/2025, mã nào đến từ tỉnh cũ hợp nhất, và cách tra.',
};
export const ARTICLES = [ARTICLE_SAPNHAP, ARTICLE_DOCMA, ARTICLE_BANGDOICHIEU, ARTICLE_GIUNGUYEN, ARTICLE_NHIEUMA];

/** Newest first; articles with the same date keep their declared order. */
export function articlesByDate(list: Article[] = ARTICLES): Article[] {
  return list.map((a, i) => ({ a, i })).sort((x, y) => (x.a.publishedAt === y.a.publishedAt ? x.i - y.i : x.a.publishedAt < y.a.publishedAt ? 1 : -1)).map((x) => x.a);
}

/** datePublished = publishedAt; dateModified = the later of publishedAt and meta.lastReviewed (ISO dates compare as strings). */
export function articleDates(a: Article, lastReviewed: string = data.meta.lastReviewed) {
  const modified = a.publishedAt > lastReviewed ? a.publishedAt : lastReviewed;
  return { published: a.publishedAt, modified, showModified: modified !== a.publishedAt };
}
