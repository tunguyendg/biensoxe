import { data } from './data';
import type { JsonLd } from './jsonld';

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
export const ARTICLES = [ARTICLE_SAPNHAP, ARTICLE_DOCMA];

/** datePublished = publishedAt; dateModified = the later of publishedAt and meta.lastReviewed (ISO dates compare as strings). */
export function articleDates(a: Article, lastReviewed: string = data.meta.lastReviewed) {
  const modified = a.publishedAt > lastReviewed ? a.publishedAt : lastReviewed;
  return { published: a.publishedAt, modified, showModified: modified !== a.publishedAt };
}

export function articleLd(a: Article, site: URL, lastReviewed: string = data.meta.lastReviewed): JsonLd {
  const { published, modified } = articleDates(a, lastReviewed);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.h1,
    description: a.description,
    inLanguage: 'vi',
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: new URL(a.path, site).href,
    publisher: { '@type': 'Organization', name: 'Biển Số' },
  };
}
