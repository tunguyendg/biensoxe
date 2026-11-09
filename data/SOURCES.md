# Data sources & verified claims

Only claims listed here may appear as facts on the site.

Status values:
- **VERIFIED-PRIMARY** — checked against the official text.
- **SECONDARY** — taken from a reputable legal-news summary.
- **SECONDARY_FULLTEXT** — transcribed from a full-text copy of the legal document on a legal portal (not the official gazette); machine-audited by `npm run data:audit` against `data/sources/*.json`; pending the Founder's comparison with the Công báo PDF.
- **OPEN** — not yet established.

| # | Claim used on site | Status | Source |
|---|---|---|---|
| 1 | Plate-code table for 34 provinces + code 80 (Cục CSGT), effective 01/7/2025 | SECONDARY_FULLTEXT → needs PRIMARY (Founder compares the Công báo PDF) | Phụ lục 02, TT 51/2025/TT-BCA, issued 30/6/2025, effective 01/7/2025, amends TT 79/2024/TT-BCA. Transcribed (2026-11-09) from the full text on [Thư Viện Pháp Luật](https://thuvienphapluat.vn/van-ban/Giao-thong-Van-tai/Thong-tu-51-2025-TT-BCA-sua-doi-Thong-tu-79-2024-TT-BCA-cap-chung-nhan-dang-ky-xe-bien-so-xe-co-gioi-663452.aspx) into `data/sources/tt51-2025-phu-luc-02.json`. Official gazette: [Công báo số 887 + 888](https://congbao.chinhphu.vn/van-ban/thong-tu-so-51-2025-tt-bca-45356.htm), posted 15/07/2025. |
| 2 | 63 → 34 provincial-level units | SECONDARY | NQ 202/2025/QH15 ([PDF](https://static3.luatvietnam.vn/uploaded/vietlawfile/2025/6/202_2025_qh15_130625135937.pdf)) |
| 3 | Moving residence to another province does not by itself require changing the plate (from 01/01/2025) | SECONDARY | TT 79/2024/TT-BCA, via [LSVN](https://lsvn.vn/se-bo-quy-dinh-chu-xe-phai-doi-dang-ky-bien-so-khi-thay-doi-noi-cu-tru-a151376.html) |
| 4 | Plates are tied to the owner's identity number; a plate is kept for 5 years after the vehicle is transferred or scrapped | SECONDARY | TT 37/2026/TT-BCA (effective 08/6/2026), via [LSVN](https://lsvn.vn/mot-so-thay-doi-moi-ve-dang-ky-xe-tu-hom-nay-a173933.html) |
| 5 | Điều 18 TT 79/2024/TT-BCA không liệt kê trường hợp phải đổi biển do sáp nhập tỉnh (F19). Luôn kèm "hỏi công an nơi đăng ký để chắc chắn"; không khẳng định biển cũ được giữ nguyên | SECONDARY_FULLTEXT | Điều 18 TT 79/2024/TT-BCA, xem hàng 14. Thay câu mặc định cũ "Chưa thấy quy định bắt buộc đổi biển…" trên bài sáp nhập và /nguon. |
| 6 | Later amendments (TT 37/2026, TT 62/2026) do not change the code table | SECONDARY | LSVN / LuatVietnam summaries. Re-check quarterly. |
| 7 | Per province: `mergedFrom` (former units merged), `areaKm2`, `population` after the merger. 23 merged provinces/cities have all three; the 11 unchanged (Hà Nội, Huế, Cao Bằng, Điện Biên, Hà Tĩnh, Lai Châu, Lạng Sơn, Nghệ An, Quảng Ninh, Thanh Hóa, Sơn La) have `mergedFrom: []` and `null` area/population | SECONDARY → needs PRIMARY | NQ 202/2025/QH15, Điều 1 khoản 1–24, read from the LuatVietnam PDF (note: the file read is an **English translation**, area/population "will have a natural area of … and a population of …"). Figures are as stated there; Điều 3 khoản 2 says the Government may update the areas after field survey. `mergedFrom` was cross-checked: it equals the distinct `formerProvince` of each province's codes for all 23. |
| 8 | `adminCenter` (trung tâm chính trị – hành chính) | **OPEN — dropped from MVP** | The NQ 202 text read does **not** state it → `null` for all 34. Founder decision 2026-11-08: not displayed anywhere; field kept in the JSON. |
| 9 | Former province of each code ("before 01/07/2025") | SECONDARY_FULLTEXT | Phụ lục 02, TT 79/2024/TT-BCA (issued 15/11/2024, effective 01/01/2025; replaced by TT 51/2025 from 01/07/2025) — the only source for "which province held this code before". Transcribed from [LuatVietnam](https://luatvietnam.vn/giao-thong/thong-tu-79-2024-tt-bca-cap-thu-hoi-chung-nhan-dang-ky-xe-bien-so-xe-co-gioi-xe-may-chuyen-dung-377888-d1.html) into `data/sources/tt79-2024-phu-luc-02.json`; each code's move is cross-checked against the NQ 202/2025 merger list. |
| 10 | Phụ lục 02 has not been amended since TT 51/2025 | SECONDARY | Consolidated text VBHN 41/VBHN-BCA (11/9/2025) of TT 79/2024 as amended: no later document amending Phụ lục 02 was found. Re-check with row 6 quarterly. |
| 11 | Màu biển và seri (F01–F07, F09): nền xanh / trắng / vàng, seri ô tô và mô tô, seri riêng CD, RM, HC, KT, tem biển đấu giá và xe năng lượng sạch, số biển gắn trên xe. Không viết về biển nền đỏ của quân đội hay ý nghĩa các ký hiệu LD, DA, MĐ, MK, TĐ, R, CT, LB (F09b: không có nguồn) | SECONDARY_FULLTEXT | TT 79/2024/TT-BCA, Điều 37 khoản 3, 4, 5. [LuatVietnam](https://luatvietnam.vn/giao-thong/thong-tu-79-2024-tt-bca-cap-thu-hoi-chung-nhan-dang-ky-xe-bien-so-xe-co-gioi-xe-may-chuyen-dung-377888-d1.html) · [VBHN 41/VBHN-BCA](https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-thong-tu-quy-dinh-ve-cap-thu-hoi-chung-nhan-dang-ky-xe-bien-so-xe-co-gioi-xe-may-chuyen-dung-119251114070809667.htm) |
| 12 | Biển xe nước ngoài NG, QT, CV, NN (F08) | SECONDARY_FULLTEXT | TT 79/2024/TT-BCA, Điều 37 khoản 6 (cùng URL hàng 11) |
| 13 | Biển số định danh (F10–F15): mã định danh của chủ xe, giữ số 5 năm khi chuyển quyền sở hữu, biển 5 số trước 01/01/2025 và các ký hiệu ngoại lệ, biển 3 số / 4 số vẫn được tham gia giao thông và khi nào đổi; TT 37/2026 giữ quy tắc, chứng nhận đăng ký điện tử trên VNeID và VNeTraffic từ 08/06/2026 (F12) | SECONDARY_FULLTEXT (F12: bài tóm tắt) | TT 79/2024/TT-BCA, Điều 3 khoản 3 (điểm d), Điều 39 khoản 1 và 3. F12: [LSVN, TT 37/2026](https://lsvn.vn/mot-so-thay-doi-moi-ve-dang-ky-xe-tu-hom-nay-a173933.html) |
| 14 | Đổi đăng ký, đổi biển, chuyển nơi cư trú (F16–F20): sáu trường hợp đổi theo Điều 18, chuyển nơi cư trú không nằm trong các trường hợp bắt buộc đổi, mẫu ĐKX13 / ĐKX14, quy định 30 ngày trước 01/01/2025 đã bỏ | SECONDARY_FULLTEXT (F20: bài tóm tắt) | TT 79/2024/TT-BCA, Điều 3 khoản 2, Điều 18, Điều 19 khoản 4 điểm đ, Điều 20 khoản 3. F20: [LSVN](https://lsvn.vn/se-bo-quy-dinh-chu-xe-phai-doi-dang-ky-bien-so-khi-thay-doi-noi-cu-tru-a151376.html) (TT 24/2023 Điều 6 khoản 3) |
| 15 | Đấu giá biển số (F21–F27): giá khởi điểm 40 triệu / 5 triệu, tiền đặt trước, bước giá 5 triệu / 500.000 đồng, nộp tiền trong 30 ngày, cấm 12 tháng, đăng ký xe trong 12 tháng (gia hạn tối đa 6 tháng), chuyển nhượng xe gắn biển. Chỉ viết mức cơ sở, không nêu giá trúng hay kết quả phiên | SECONDARY_FULLTEXT | Luật 36/2024/QH15 Điều 38 ([hethongphapluat](https://hethongphapluat.com/luat-trat-tu-an-toan-giao-thong-duong-bo-2024/dieu-38)); NĐ 156/2024/NĐ-CP Điều 3, 4, 6, 7, 14, 19 ([chương 1](https://hethongphapluat.com/nghi-dinh-156-2024-nd-cp-nam-2024-quy-dinh-ve-dau-gia-bien-so-xe/chuong-1), [chương 2](https://hethongphapluat.com/nghi-dinh-156-2024-nd-cp-nam-2024-quy-dinh-ve-dau-gia-bien-so-xe/chuong-2), [.doc](https://vbpl.vn/TW/Lists/vbpq/Attachments/180301/156_2024_ND-CP_635371.doc)) |

**Last full review:** 2026-11-08 (claude.ai research). **Next review due:** 2027-02.

## Founder verification procedure
1. Get the official Phụ lục 02 of TT 51/2025/TT-BCA (Công báo PDF, or the Bộ Công an portal).
2. Compare it row by row with `data/plate-codes.json`, `provinces[].codes`.
3. Note the exact name written for code 75 and for code 80.
4. Approve the change of `verified:false` → `true`, and update row 1 to VERIFIED-PRIMARY.

- 2026-11-09: Founder duyệt 115 bản ghi (audit sha a457d0984fad); đối chiếu PDF Công báo 887+888 (TT 51/2025/TT-BCA, Phụ lục 02). Quyết định: {"code:75":"Hiển thị 'Huế'; ghi chú tên trong Phụ lục là 'Thừa Thiên Huế'","province:hue":"Hiển thị 'Huế'"}

## Ghi chú cho Founder (V1.2, đọc ngày 09/11/2026)
- Hàng 11–15 lấy từ `docs/CONTENT_SOURCES_V1_2.md` (mã F01–F27). Toàn bộ là bản toàn văn trên LuatVietnam / hethongphapluat, chưa đối chiếu Công báo.
- TT 79/2024 đã được sửa bởi TT 13/2025, TT 51/2025, TT 37/2026 (hiệu lực 08/06/2026) và TT 62/2026 (sửa khoản 2 Điều 7); bản toàn văn đã đọc là bản gốc TT 79/2024.
- **Cần Founder kiểm Điều 3, 18, 37 TT 79/2024 trên văn bản hợp nhất mới nhất trước khi phát hành.**
