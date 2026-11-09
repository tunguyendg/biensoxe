# SEO V1.1 — structured data + content audit (2026-11-09)

## Task 01 — Structured data

### A. Audit trước khi sửa (dist của commit e97f73e)
| Trang | Schema có | Thiếu / không phù hợp | Lỗi |
|---|---|---|---|
| `/` | WebSite (block riêng, name "BIEN SO") | WebPage, Organization | tên thương hiệu "BIEN SO" lệch "Biển Số" ở manifest/header |
| `/bang-ma` | không có | CollectionPage, ItemList tỉnh, BreadcrumbList | trang có breadcrumb hiển thị nhưng không có BreadcrumbList |
| `/80`, `/83`, `/tinh/can-tho` | BreadcrumbList (block riêng) | WebPage, Organization | không có `@id`, không nối với trang |
| `/kien-thuc` | BreadcrumbList | CollectionPage, ItemList | — |
| 2 bài kiến thức | BreadcrumbList + Article (2 block) | `@id`, author/publisher là chuỗi/Organization nhúng không `@id`, image | publisher chỉ có name, không có logo |
| `/nguon` | FAQPage | WebPage, BreadcrumbList | breadcrumb hiển thị nhưng không có markup |

Không thấy: trùng node, URL lệch canonical, breadcrumb lệch, ngày sai, markup cho nội dung không hiển thị.

### B. Sau khi sửa: 1 khối `{"@context","@graph"}` mỗi trang
| Loại trang | Node trong @graph |
|---|---|
| `/` | Organization, WebSite (đầy đủ), WebPage |
| `/bang-ma` | Organization, CollectionPage, BreadcrumbList, ItemList (34 tỉnh, đúng thứ tự hiển thị) |
| `/kien-thuc` | Organization, CollectionPage, BreadcrumbList, ItemList (bài, mới nhất trước) |
| `/[code]`, `/tinh/[slug]` | Organization, WebPage, BreadcrumbList |
| `/nguon` | Organization, WebPage, BreadcrumbList, FAQPage (giữ, nội dung hiển thị) |
| bài kiến thức | Organization, WebPage, BreadcrumbList, Article |
| `/404` | không có markup (noindex, không canonical) |

`@id`: `…/#organization`, `…/#website` (chỉ định nghĩa trên `/`, trang khác tham chiếu), `<canonical>#webpage`, `#breadcrumb`, `#article`, `#itemlist`, `#faq`. Organization tối giản (name, url, logo 512 tuyệt đối), là author + publisher của Article. Không dùng: Product, Review, AggregateRating, GovernmentOrganization, LocalBusiness, Person, SearchAction, FAQPage mới. `og:site_name` đổi "BIEN SO" → "Biển Số" cho khớp WebSite.name.

### D. Hợp lệ / đủ điều kiện / Google quyết định
- Hợp lệ theo Schema.org: tất cả node (kiểm bằng test cấu trúc, `@id` không trùng, mọi tham chiếu `@id` đều giải được).
- Đủ điều kiện rich result của Google: BreadcrumbList, Article. FAQPage: Google đã hạn chế hiển thị FAQ rich result cho đa số site, nên coi là markup trung tính. Organization chỉ dùng để Google hiểu logo/tên, không phải rich result. WebSite/WebPage/CollectionPage/ItemList là mô tả cấu trúc, không có rich result riêng.
- Google tự quyết định có hiển thị rich result và tên/logo hay không. Schema không phải yếu tố tăng thứ hạng.

## Task 02 — Content audit
| Chủ đề | Search intent | URL đích | Nguồn dữ liệu | Trang liên quan | Cannibalization |
|---|---|---|---|---|---|
| Tra mã biển số theo 2 số đầu | "biển số 83 là tỉnh nào" | `/[code]`, `/` | plate-codes.json | `/tinh/*` | thấp (mỗi mã 1 URL) |
| Bảng mã hiện hành | "bảng biển số xe 34 tỉnh" | `/bang-ma` | plate-codes.json | bài đối chiếu | trung bình với bài đối chiếu: đã tách bằng trục (mã hiện hành vs tỉnh cũ) và link chéo |
| Mã của một tỉnh | "biển số xe Cần Thơ" | `/tinh/[slug]` | plate-codes.json | bài nhiều mã | thấp |
| Sáp nhập thay đổi gì | "biển số xe sau sáp nhập" | bài sáp nhập 2025 | NQ 202, TT 51 | bài đối chiếu, bài giữ nguyên | trung bình: bài này chỉ tổng quan, danh sách nằm ở 2 bài kia |
| Cách đọc 2 số đầu | "2 số đầu biển số xe là gì" | bài cách đọc | TT 51 | trang chủ | thấp |
| **Mới** Tỉnh cũ → tỉnh nay + mã | "biển số xe Bình Dương cũ", "tỉnh X sáp nhập vào đâu" | bài bảng đối chiếu | plate-codes.json, NQ 202 | `/bang-ma`, `/tinh/*`, `/[code]` | trung bình với `/[code]` (mã đơn lẻ); bài là bảng tổng, trang mã là chi tiết |
| **Mới** Tỉnh nào giữ nguyên / hợp nhất từ 2–3 đơn vị | "tỉnh nào không sáp nhập 2025" | bài giữ nguyên | plate-codes.json, NQ 202 | bài đối chiếu | trung bình: trục khác (theo nhóm), phần hợp nhất chỉ liệt kê tên + số mã |
| **Mới** Tỉnh có nhiều mã | "tỉnh nào có nhiều mã biển số" | bài nhiều mã | plate-codes.json | `/bang-ma`, trang tỉnh | thấp |

### Bài "Tra khi chỉ nhớ tên tỉnh cũ": KHÔNG viết
Cùng intent ("biển số [tỉnh cũ]") với bài bảng đối chiếu, nơi mỗi dòng đã là một tỉnh cũ kèm mã. Bài thứ hai chỉ lặp 5 dòng của bảng đó và các trang mã, nên sẽ mỏng và cạnh tranh với chính bảng. Thay bằng: **"Tỉnh nào giữ nguyên, tỉnh nào hợp nhất sau sáp nhập 2025?"** (11 giữ nguyên / 6 hợp nhất từ 3 / 17 hợp nhất từ 2, đủ dữ liệu từ data, intent khác).

## E. Đề xuất (chưa làm): trang đích cho 29 tỉnh cũ đã hợp nhất
- Lợi ích: khớp truy vấn "biển số xe [tỉnh cũ]" (vd Bình Dương, Sóc Trăng), URL riêng dễ chia sẻ.
- Rủi ro: nội dung gần trùng với dòng của bài đối chiếu và trang mã (đã có đủ thông tin), dễ thành trang mỏng; tăng 29 URL cần giữ chất lượng; cannibalization với `/[code]`.
- Cấu trúc URL đề xuất: `/tinh-cu/[slug-tinh-cu]` (vd `/tinh-cu/binh-duong`), 29 trang (63 tỉnh cũ trừ 34 đơn vị còn giữ tên/đơn vị hiện hành = các tỉnh cũ đổi tên/đã hợp nhất).
- Nội dung tối thiểu sinh từ data: tên tỉnh cũ, nay thuộc tỉnh nào (link), mã biển của tỉnh cũ (link), các tỉnh cùng hợp nhất, câu giới hạn, nguồn. Không thêm văn bản mẫu dài.
- Khuyến nghị: chờ 2–4 tuần dữ liệu Search Console (truy vấn thực có chứa tên tỉnh cũ, trang nào đang nhận) rồi mới quyết.
