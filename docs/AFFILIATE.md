# Affiliate (Shopee qua ACCESSTRADE) — hướng dẫn cho Founder

Khu affiliate **không chặn launch**: không có offer hợp lệ thì khu này tự ẩn, site vẫn build bình thường.
Chỉ hiện danh mục (icon + tên + mô tả + nút "Xem trên Shopee"), không giá, không ảnh sản phẩm, không voucher.

## Trước khi bật
- Đọc https://accesstrade.vn/publisher-policy/ (quy định publisher) rồi mới chạy lần đầu.
- Tạo `.env` ở thư mục gốc (đã gitignore; mẫu: `.env.example`): `ACCESSTRADE_TOKEN=<token>`. Không dán token vào chat, code hay commit.

## Quy trình
1. Sửa `data/offers.config.json` (id, title, blurb ≤ 60 ký tự, keyword, active). Blurb mô tả công dụng, không nhắc giá/giảm giá/chất lượng.
2. `npm run offers:links` — tạo link (campaign Shopee Smartlink, sub1 = vị trí `result`/`tinh`, sub2 = id danh mục) → ghi `data/offers.json`. Lỗi bất kỳ thì file cũ được giữ nguyên.
3. `npm run offers:check` — theo redirect, xác nhận đích cuối là Shopee, ghi `checkedAt` + `status` (ok/failed). Lệnh này cũng bấm vào link affiliate một lần mỗi link.
4. Commit `data/offers.json`, rồi build/deploy (sau khi được duyệt).

## Chu kỳ
- Chạy lại `offers:check` **mỗi 2 tuần**. Build chỉ hiển thị offer `ok` có `checkedAt` ≤ 30 ngày; quá hạn thì tự ẩn.
- Đổi keyword/blurb → chạy lại bước 2 và 3.

## Xác minh hoa hồng
1. Mở trang bằng trình duyệt sạch, bấm một thẻ, đặt 1 đơn thử trên Shopee.
2. Vào pub2.accesstrade.vn → đơn hàng, tìm đơn có `sub1` = `result` hoặc `tinh` và `sub2` = id danh mục.
3. Thấy đơn ghi nhận (có thể chậm vài ngày) thì mới coi là chạy đúng.

## Ghi chú
- Link mở `target="_blank"`, `rel="sponsored noopener noreferrer"`, `referrerpolicy="no-referrer"`. Không có biển số/mã tỉnh trong bất kỳ sub/utm nào.
- Không thêm script bên thứ ba. Không quảng cáo khung/ốp biển số.
- Khu affiliate không có trên `/nguon`, `/bang-ma`, `/404`.
