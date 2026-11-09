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
| 5 | No rule found requiring existing plates to be changed because of the merger | **OPEN** | TT 51/2025 contains no such provision in the text reviewed. Do not state this as fact. |
| 6 | Later amendments (TT 37/2026, TT 62/2026) do not change the code table | SECONDARY | LSVN / LuatVietnam summaries. Re-check quarterly. |
| 7 | Per province: `mergedFrom` (former units merged), `areaKm2`, `population` after the merger. 23 merged provinces/cities have all three; the 11 unchanged (Hà Nội, Huế, Cao Bằng, Điện Biên, Hà Tĩnh, Lai Châu, Lạng Sơn, Nghệ An, Quảng Ninh, Thanh Hóa, Sơn La) have `mergedFrom: []` and `null` area/population | SECONDARY → needs PRIMARY | NQ 202/2025/QH15, Điều 1 khoản 1–24, read from the LuatVietnam PDF (note: the file read is an **English translation**, area/population "will have a natural area of … and a population of …"). Figures are as stated there; Điều 3 khoản 2 says the Government may update the areas after field survey. `mergedFrom` was cross-checked: it equals the distinct `formerProvince` of each province's codes for all 23. |
| 8 | `adminCenter` (trung tâm chính trị – hành chính) | **OPEN — dropped from MVP** | The NQ 202 text read does **not** state it → `null` for all 34. Founder decision 2026-11-08: not displayed anywhere; field kept in the JSON. |
| 9 | Former province of each code ("before 01/07/2025") | SECONDARY_FULLTEXT | Phụ lục 02, TT 79/2024/TT-BCA (issued 15/11/2024, effective 01/01/2025; replaced by TT 51/2025 from 01/07/2025) — the only source for "which province held this code before". Transcribed from [LuatVietnam](https://luatvietnam.vn/giao-thong/thong-tu-79-2024-tt-bca-cap-thu-hoi-chung-nhan-dang-ky-xe-bien-so-xe-co-gioi-xe-may-chuyen-dung-377888-d1.html) into `data/sources/tt79-2024-phu-luc-02.json`; each code's move is cross-checked against the NQ 202/2025 merger list. |
| 10 | Phụ lục 02 has not been amended since TT 51/2025 | SECONDARY | Consolidated text VBHN 41/VBHN-BCA (11/9/2025) of TT 79/2024 as amended: no later document amending Phụ lục 02 was found. Re-check with row 6 quarterly. |

**Last full review:** 2026-11-08 (claude.ai research). **Next review due:** 2027-02.

## Founder verification procedure
1. Get the official Phụ lục 02 of TT 51/2025/TT-BCA (Công báo PDF, or the Bộ Công an portal).
2. Compare it row by row with `data/plate-codes.json`, `provinces[].codes`.
3. Note the exact name written for code 75 and for code 80.
4. Approve the change of `verified:false` → `true`, and update row 1 to VERIFIED-PRIMARY.

- 2026-11-09: Founder duyệt 115 bản ghi (audit sha a457d0984fad); đối chiếu PDF Công báo 887+888 (TT 51/2025/TT-BCA, Phụ lục 02). Quyết định: {"code:75":"Hiển thị 'Huế'; ghi chú tên trong Phụ lục là 'Thừa Thiên Huế'","province:hue":"Hiển thị 'Huế'"}
