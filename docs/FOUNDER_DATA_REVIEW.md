# Founder duyệt dữ liệu, khoảng 10 phút

Công cụ đã so khớp 115 bản ghi với bản chép toàn văn của 3 văn bản. Việc còn lại máy không làm thay được: xác nhận bản chép **giống bản Công báo chính thức**, rồi chốt 1 quyết định.

## 1. Đối chiếu Phụ lục 02 (bước bắt buộc)

1. Mở https://congbao.chinhphu.vn/van-ban/thong-tu-so-51-2025-tt-bca-45356.htm
2. Tải file PDF "2025_887 + 888_51-2025-TT-BCA.pdf" và tìm đến **Phụ lục số 02**.
3. So từng dòng với bảng dưới đây. Bảng có 35 dòng, khớp với `data/sources/tt51-2025-phu-luc-02.json`.

| # | Địa phương | Ký hiệu |   | # | Địa phương | Ký hiệu |
|---|---|---|---|---|---|---|
| 1 | An Giang | 67, 68 | | 19 | Lạng Sơn | 12 |
| 2 | Bắc Ninh | 98, 99 | | 20 | Lào Cai | 21, 24 |
| 3 | Cà Mau | 69, 94 | | 21 | Nghệ An | 37 |
| 4 | Cần Thơ | 65, 83, 95 | | 22 | Ninh Bình | 18, 35, 90 |
| 5 | Cao Bằng | 11 | | 23 | Phú Thọ | 19, 28, 88 |
| 6 | Đà Nẵng | 43, 92 | | 24 | Quảng Ngãi | 76, 82 |
| 7 | Đắk Lắk | 47, 78 | | 25 | Quảng Ninh | 14 |
| 8 | Điện Biên | 27 | | 26 | Quảng Trị | 73, 74 |
| 9 | Đồng Nai | 39, 60, 93 | | 27 | Sơn La | 26 |
| 10 | Đồng Tháp | 63, 66 | | 28 | Tây Ninh | 62, 70 |
| 11 | Gia Lai | 77, 81 | | 29 | Thái Nguyên | 20, 97 |
| 12 | Hà Nội | 29, 30–33, 40 | | 30 | Thanh Hóa | 36 |
| 13 | Hà Tĩnh | 38 | | 31 | Thừa Thiên Huế | 75 |
| 14 | Hải Phòng | 15, 16, 34 | | 32 | TP. Hồ Chí Minh | 41; 50, 51–59; 61, 72 |
| 15 | Hưng Yên | 17, 89 | | 33 | Tuyên Quang | 22, 23 |
| 16 | Khánh Hòa | 79, 85 | | 34 | Vĩnh Long | 64, 71, 84 |
| 17 | Lai Châu | 25 | | 35 | Cục Cảnh sát giao thông | 80 |
| 18 | Lâm Đồng | 48, 49, 86 | | | | |

Nếu có dòng nào khác bản PDF: **dừng lại**, sửa `data/sources/tt51-2025-phu-luc-02.json` cho đúng PDF, rồi chạy lại `npm run data:audit`.

Tỉnh cũ của từng mã lấy từ Phụ lục 02 của TT 79/2024. Phụ lục này đã bị thay thế, nhưng là nguồn duy nhất cho câu hỏi "trước 01/07/2025 mã này của tỉnh nào". Ngoài ra, công cụ còn tự kiểm tra rằng mỗi mã chuyển từ tỉnh cũ sang tỉnh mới đúng như danh sách sáp nhập trong NQ 202/2025.

## 2. Quyết định tên mã 75

- Phụ lục 02 ghi **"Thừa Thiên Huế"**.
- NQ 202/2025 ghi **"thành phố Huế"**.

Đề xuất: hiển thị **"Huế"**, vì đây là tên hành chính hiện hành. Trang `/75` thêm một câu ghi chú: "Phụ lục 02 TT 51/2025 ghi 'Thừa Thiên Huế'."

Để duyệt, tạo file `data/DECISIONS.json` với nội dung:
```json
{ "code:75": "Hiển thị 'Huế'; ghi chú tên trong Phụ lục là 'Thừa Thiên Huế'", "province:hue": "Hiển thị 'Huế'" }
```

## 3. Duyệt

```bash
npm run data:audit
npm run data:approve -- --founder-approved --gazette-checked
BIEN_SO_STRICT=1 SITE_URL=https://bienso.org npm run build
```
