# Affiliate (Shopee qua ACCESSTRADE) — hướng dẫn cho Founder

Khu affiliate **không chặn launch**: không có offer hợp lệ thì khu này tự ẩn, site vẫn build bình thường.
Chỉ hiện danh mục (icon + tên + mô tả + nút "Xem trên Shopee"), không giá, không ảnh sản phẩm, không voucher.

## Trước khi bật
- Đọc https://accesstrade.vn/publisher-policy/ (quy định publisher) rồi mới chạy lần đầu.
- Tạo `.env` ở thư mục gốc (đã gitignore; mẫu: `.env.example`): `ACCESSTRADE_TOKEN=<token>`. Không dán token vào chat, code hay commit.

## Quy trình
1. Sửa `data/offers.config.json` (id, label ≤ 30, title ≤ 45, blurb ≤ 50 ký tự, keyword, active). Chữ hiển thị lấy từ file này; không ghi giá, %, giảm, sale, giá sốc, rẻ nhất, free ship, voucher (thẻ danh mục không có ngày kết thúc; build sẽ fail).
2. `npm run offers:links` — tạo link (campaign Shopee Smartlink, sub1 = vị trí `result`/`tinh`, sub2 = id danh mục) → ghi `data/offers.json`. Lỗi bất kỳ thì file cũ được giữ nguyên.
3. `npm run offers:check` — theo redirect, xác nhận đích cuối là Shopee, ghi `checkedAt` + `status` (ok/failed). Lệnh này cũng bấm vào link affiliate một lần mỗi link.
4. Commit `data/offers.json`, rồi build/deploy (sau khi được duyệt).

## Chu kỳ
- Chạy lại `offers:check` **mỗi 2 tuần**. Build chỉ hiển thị offer `ok` có `checkedAt` ≤ 30 ngày; quá hạn thì tự ẩn.
- Đổi keyword → chạy lại bước 2 và 3 (link tìm kiếm có `&sortBy=sales`; dòng "Bán chạy trên Shopee" chỉ hiện khi link đã lưu có tham số này, nên phải chạy lại `offers:links` sau khi đổi). Đổi title/blurb/label thì không cần tạo lại link.

## Xác minh hoa hồng
1. Mở trang bằng trình duyệt sạch, bấm một thẻ, đặt 1 đơn thử trên Shopee.
2. Vào pub2.accesstrade.vn → đơn hàng, tìm đơn có `sub1` = `result` hoặc `tinh` và `sub2` = id danh mục.
3. Thấy đơn ghi nhận (có thể chậm vài ngày) thì mới coi là chạy đúng.

## Ghi chú
- Link mở `target="_blank"`, `rel="sponsored noopener noreferrer"`, `referrerpolicy="no-referrer"`. Không có biển số/mã tỉnh trong bất kỳ sub/utm nào.
- Không thêm script bên thứ ba. Không quảng cáo khung/ốp biển số.
- Khu affiliate không có trên `/nguon`, `/bang-ma`, `/404`.

## Banner nổi bật (Featured)
Tối đa **2** banner, hiện ở cuối nội dung trang chủ, `/[code]`, `/tinh/[slug]` (không có trên `/nguon`, `/bang-ma`, `/404`), nhãn "Quảng cáo".
1. Sửa `data/featured.config.json`: `id`, `title` (≤ 50 ký tự), `subtitle` (≤ 80), `targetUrl` (trang sản phẩm / shop / chương trình, phải là `https://shopee.vn/…` hoặc `https://shp.ee/…`), `image` (tuỳ chọn: `/featured/<tên>.webp`, ≤ 60 KB, đặt trong `public/featured/`), `startAt`/`endAt` (ISO có múi giờ, ví dụ `2026-11-11T00:00:00+07:00`), `active`.
2. `npm run offers:links` (tạo aff_link cho cả danh mục lẫn banner, sub1 = `featured`, sub2 = id; lỗi thì cả hai file cũ giữ nguyên) → `npm run offers:check` → commit `data/featured.json` + config → push = deploy.
- Tổng cộng mỗi trang tối đa **2 khối quảng cáo** (banner + thẻ danh mục). Banner hợp lệ được ưu tiên: 2 banner → 0 thẻ, 1 banner → 1 thẻ, 0 banner → 2 thẻ. Khi trình duyệt ẩn banner hết hạn, chỗ đó để trống (không lấp bằng thẻ).
- Build tự **loại** banner ngoài khoảng `startAt`–`endAt`, hoặc `status` ≠ ok, hoặc `checkedAt` cũ hơn **30 ngày** (giống thẻ danh mục: chạy `offers:check` mỗi 2 tuần, nếu không banner sẽ tự ẩn). Site tĩnh không tự build lại khi hết hạn, nên có thêm script nhỏ (≈ 200 byte) ẩn banner đã quá `endAt` theo giờ trình duyệt; hết banner thì cả khu ẩn. Vẫn nên gỡ banner khỏi config và deploy lại sau khi kết thúc chương trình.
- Build **fail** nếu: > 2 mục `active`; `targetUrl` của mục active không phải shopee.vn/shp.ee (https); tiêu đề/mô tả có `%`, "giảm", "đ", "k", "free ship", "voucher" mà không có `endAt`; ảnh sai đường dẫn/quá 60 KB.
- Không hiện giá cụ thể trong chữ nếu không chắc còn đúng; chữ có thời hạn thì luôn đặt `endAt`.

Banner nổi bật: chip vàng "Đến hết dd/mm" tính từ `endAt` (ngày cuối = ngày trước mốc endAt). Từ như sale, giảm, %, voucher, free ship, giá sốc, rẻ nhất chỉ được dùng khi banner có `endAt`.
