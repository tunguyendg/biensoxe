# Báo cáo kiểm tra dữ liệu (tự động)

Thời điểm: 2026-11-09T06:01:00.165Z · SHA-256 data/plate-codes.json: `7bd9ca6a6117c2f5…`

> Công cụ chỉ ĐỌC dữ liệu. Kết quả MATCH nghĩa là khớp với bản chép nguồn trong `data/sources/`. Bản chép là nguồn thứ cấp (toàn văn trên LuatVietnam/Thư Viện Pháp Luật) cho tới khi Founder đối chiếu PDF Công báo.

## Tổng quan

- Tổng bản ghi: **115** = 81 mã (80 mã tỉnh + 1 mã đặc biệt) + 34 tỉnh/thành
- Đã verified:true: 115
- MATCH: 80 mã, 33 tỉnh
- MATCH_NEEDS_DECISION: 1 mã, 1 tỉnh
- MISMATCH: 0 mã, 0 tỉnh
- Độ phủ: đủ 81 mã TT51, đủ 63 tỉnh cũ TT79, không thừa/thiếu

## Cần xem


- **code:75** — MATCH_NEEDS_DECISION · Phụ lục TT51 ghi "Thừa Thiên Huế"; NQ202 gọi là "thành phố Huế" — tên hiển thị cần Founder chốt; TT79: Thừa Thiên Huế → TT51: Thừa Thiên Huế
- **province:hue** — MATCH_NEEDS_DECISION · Phụ lục TT51 ghi "Thừa Thiên Huế"; NQ202 ghi "thành phố Huế" — Founder chốt tên hiển thị

## Chi tiết từng mã

| Mã | Kết quả | Đối chiếu |
|---|---|---|
| 11 | MATCH | TT79: Cao Bằng → TT51: Cao Bằng |
| 12 | MATCH | TT79: Lạng Sơn → TT51: Lạng Sơn |
| 14 | MATCH | TT79: Quảng Ninh → TT51: Quảng Ninh |
| 15 | MATCH | TT79: Hải Phòng → TT51: Hải Phòng |
| 16 | MATCH | TT79: Hải Phòng → TT51: Hải Phòng |
| 17 | MATCH | TT79: Thái Bình → TT51: Hưng Yên |
| 18 | MATCH | TT79: Nam Định → TT51: Ninh Bình |
| 19 | MATCH | TT79: Phú Thọ → TT51: Phú Thọ |
| 20 | MATCH | TT79: Thái Nguyên → TT51: Thái Nguyên |
| 21 | MATCH | TT79: Yên Bái → TT51: Lào Cai |
| 22 | MATCH | TT79: Tuyên Quang → TT51: Tuyên Quang |
| 23 | MATCH | TT79: Hà Giang → TT51: Tuyên Quang |
| 24 | MATCH | TT79: Lào Cai → TT51: Lào Cai |
| 25 | MATCH | TT79: Lai Châu → TT51: Lai Châu |
| 26 | MATCH | TT79: Sơn La → TT51: Sơn La |
| 27 | MATCH | TT79: Điện Biên → TT51: Điện Biên |
| 28 | MATCH | TT79: Hòa Bình → TT51: Phú Thọ |
| 29 | MATCH | TT79: Hà Nội → TT51: Hà Nội |
| 30 | MATCH | TT79: Hà Nội → TT51: Hà Nội |
| 31 | MATCH | TT79: Hà Nội → TT51: Hà Nội |
| 32 | MATCH | TT79: Hà Nội → TT51: Hà Nội |
| 33 | MATCH | TT79: Hà Nội → TT51: Hà Nội |
| 34 | MATCH | TT79: Hải Dương → TT51: Hải Phòng |
| 35 | MATCH | TT79: Ninh Bình → TT51: Ninh Bình |
| 36 | MATCH | TT79: Thanh Hóa → TT51: Thanh Hóa |
| 37 | MATCH | TT79: Nghệ An → TT51: Nghệ An |
| 38 | MATCH | TT79: Hà Tĩnh → TT51: Hà Tĩnh |
| 39 | MATCH | TT79: Đồng Nai → TT51: Đồng Nai |
| 40 | MATCH | TT79: Hà Nội → TT51: Hà Nội |
| 41 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 43 | MATCH | TT79: Đà Nẵng → TT51: Đà Nẵng |
| 47 | MATCH | TT79: Đắk Lắk → TT51: Đắk Lắk |
| 48 | MATCH | TT79: Đắk Nông → TT51: Lâm Đồng |
| 49 | MATCH | TT79: Lâm Đồng → TT51: Lâm Đồng |
| 50 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 51 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 52 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 53 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 54 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 55 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 56 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 57 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 58 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 59 | MATCH | TT79: TP. Hồ Chí Minh → TT51: TP. Hồ Chí Minh |
| 60 | MATCH | TT79: Đồng Nai → TT51: Đồng Nai |
| 61 | MATCH | TT79: Bình Dương → TT51: TP. Hồ Chí Minh |
| 62 | MATCH | TT79: Long An → TT51: Tây Ninh |
| 63 | MATCH | TT79: Tiền Giang → TT51: Đồng Tháp |
| 64 | MATCH | TT79: Vĩnh Long → TT51: Vĩnh Long |
| 65 | MATCH | TT79: Cần Thơ → TT51: Cần Thơ |
| 66 | MATCH | TT79: Đồng Tháp → TT51: Đồng Tháp |
| 67 | MATCH | TT79: An Giang → TT51: An Giang |
| 68 | MATCH | TT79: Kiên Giang → TT51: An Giang |
| 69 | MATCH | TT79: Cà Mau → TT51: Cà Mau |
| 70 | MATCH | TT79: Tây Ninh → TT51: Tây Ninh |
| 71 | MATCH | TT79: Bến Tre → TT51: Vĩnh Long |
| 72 | MATCH | TT79: Bà Rịa – Vũng Tàu → TT51: TP. Hồ Chí Minh |
| 73 | MATCH | TT79: Quảng Bình → TT51: Quảng Trị |
| 74 | MATCH | TT79: Quảng Trị → TT51: Quảng Trị |
| 75 | MATCH_NEEDS_DECISION | Phụ lục TT51 ghi "Thừa Thiên Huế"; NQ202 gọi là "thành phố Huế" — tên hiển thị cần Founder chốt; TT79: Thừa Thiên Huế → TT51: Thừa Thiên Huế |
| 76 | MATCH | TT79: Quảng Ngãi → TT51: Quảng Ngãi |
| 77 | MATCH | TT79: Bình Định → TT51: Gia Lai |
| 78 | MATCH | TT79: Phú Yên → TT51: Đắk Lắk |
| 79 | MATCH | TT79: Khánh Hòa → TT51: Khánh Hòa |
| 80 | MATCH | TT51: Cục Cảnh sát giao thông |
| 81 | MATCH | TT79: Gia Lai → TT51: Gia Lai |
| 82 | MATCH | TT79: Kon Tum → TT51: Quảng Ngãi |
| 83 | MATCH | TT79: Sóc Trăng → TT51: Cần Thơ |
| 84 | MATCH | TT79: Trà Vinh → TT51: Vĩnh Long |
| 85 | MATCH | TT79: Ninh Thuận → TT51: Khánh Hòa |
| 86 | MATCH | TT79: Bình Thuận → TT51: Lâm Đồng |
| 88 | MATCH | TT79: Vĩnh Phúc → TT51: Phú Thọ |
| 89 | MATCH | TT79: Hưng Yên → TT51: Hưng Yên |
| 90 | MATCH | TT79: Hà Nam → TT51: Ninh Bình |
| 92 | MATCH | TT79: Quảng Nam → TT51: Đà Nẵng |
| 93 | MATCH | TT79: Bình Phước → TT51: Đồng Nai |
| 94 | MATCH | TT79: Bạc Liêu → TT51: Cà Mau |
| 95 | MATCH | TT79: Hậu Giang → TT51: Cần Thơ |
| 97 | MATCH | TT79: Bắc Kạn → TT51: Thái Nguyên |
| 98 | MATCH | TT79: Bắc Giang → TT51: Bắc Ninh |
| 99 | MATCH | TT79: Bắc Ninh → TT51: Bắc Ninh |

## Chi tiết từng tỉnh

| Tỉnh | Kết quả | Ghi chú |
|---|---|---|
| ha-noi | MATCH | region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| hai-phong | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| quang-ninh | MATCH | region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| bac-ninh | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| hung-yen | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| ninh-binh | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| phu-tho | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| thai-nguyen | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| tuyen-quang | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| lao-cai | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| cao-bang | MATCH | region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| lang-son | MATCH | region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| dien-bien | MATCH | region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| lai-chau | MATCH | region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| son-la | MATCH | region "bac" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| thanh-hoa | MATCH | region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| nghe-an | MATCH | region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| ha-tinh | MATCH | region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| quang-tri | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| hue | MATCH_NEEDS_DECISION | Phụ lục TT51 ghi "Thừa Thiên Huế"; NQ202 ghi "thành phố Huế" — Founder chốt tên hiển thị; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| da-nang | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| quang-ngai | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| gia-lai | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| dak-lak | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| khanh-hoa | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| lam-dong | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "trung" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| ho-chi-minh | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| dong-nai | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| tay-ninh | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| can-tho | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| vinh-long | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| dong-thap | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| an-giang | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |
| ca-mau | MATCH | Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified; region "nam" là phân nhóm biên tập, không phải dữ liệu pháp lý |

## Nguồn

- Thông tư 51/2025/TT-BCA, Phụ lục số 02 — Ký hiệu biển số xe ô tô, xe mô tô, xe máy chuyên dùng trong nước — SECONDARY_FULLTEXT — chép từ bản toàn văn trên Thư Viện Pháp Luật, khớp bảng LuatVietnam; Founder cần đối chiếu PDF Công báo 887+888 — https://thuvienphapluat.vn/van-ban/Giao-thong-Van-tai/Thong-tu-51-2025-TT-BCA-sua-doi-Thong-tu-79-2024-TT-BCA-cap-chung-nhan-dang-ky-xe-bien-so-xe-co-gioi-663452.aspx — Công báo: https://congbao.chinhphu.vn/van-ban/thong-tu-so-51-2025-tt-bca-45356.htm
- Thông tư 79/2024/TT-BCA, Phụ lục số 02 (bản trước khi bị thay thế) — SECONDARY_FULLTEXT — chép từ bản toàn văn trên LuatVietnam; chưa đối chiếu bản Công báo — https://luatvietnam.vn/giao-thong/thong-tu-79-2024-tt-bca-cap-thu-hoi-chung-nhan-dang-ky-xe-bien-so-xe-co-gioi-xe-may-chuyen-dung-377888-d1.html
- Nghị quyết 202/2025/QH15 về việc sắp xếp đơn vị hành chính cấp tỉnh — SECONDARY_FULLTEXT — PDF văn bản trên LuatVietnam — https://static3.luatvietnam.vn/uploaded/vietlawfile/2025/6/202_2025_qh15_130625135937.pdf
