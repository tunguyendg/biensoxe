# Data sources & verified claims

Only claims listed here may appear as facts on the site.

Status values:
- **VERIFIED-PRIMARY** — checked against the official text.
- **SECONDARY** — taken from a reputable legal-news summary.
- **OPEN** — not yet established.

| # | Claim used on site | Status | Source |
|---|---|---|---|
| 1 | Plate-code table for 34 provinces + code 80 (Cục CSGT), effective 01/7/2025 | SECONDARY → needs PRIMARY | Phụ lục 02, TT 51/2025/TT-BCA, issued 30/6/2025, effective 01/7/2025, amends TT 79/2024/TT-BCA. Table seen via [LuatVietnam](https://luatvietnam.vn/tin-van-ban-moi/quy-dinh-ve-bien-so-xe-cua-34-tinh-thanh-tu-01-7-2025-186-102811-article.html). Official text: [vbpl .doc](https://vbpl.moj.gov.vn/TW/Lists/vbpq/Attachments/179019/C08TT51.doc) (the appendix is not included in that file — find it in Công báo). |
| 2 | 63 → 34 provincial-level units | SECONDARY | NQ 202/2025/QH15 ([PDF](https://static3.luatvietnam.vn/uploaded/vietlawfile/2025/6/202_2025_qh15_130625135937.pdf)) |
| 3 | Moving residence to another province does not by itself require changing the plate (from 01/01/2025) | SECONDARY | TT 79/2024/TT-BCA, via [LSVN](https://lsvn.vn/se-bo-quy-dinh-chu-xe-phai-doi-dang-ky-bien-so-khi-thay-doi-noi-cu-tru-a151376.html) |
| 4 | Plates are tied to the owner's identity number; a plate is kept for 5 years after the vehicle is transferred or scrapped | SECONDARY | TT 37/2026/TT-BCA (effective 08/6/2026), via [LSVN](https://lsvn.vn/mot-so-thay-doi-moi-ve-dang-ky-xe-tu-hom-nay-a173933.html) |
| 5 | No rule found requiring existing plates to be changed because of the merger | **OPEN** | TT 51/2025 contains no such provision in the text reviewed. Do not state this as fact. |
| 6 | Later amendments (TT 37/2026, TT 62/2026) do not change the code table | SECONDARY | LSVN / LuatVietnam summaries. Re-check quarterly. |
| 7 | Per province: `mergedFrom` (former units merged), `areaKm2`, `population` after the merger. 23 merged provinces/cities have all three; the 11 unchanged (Hà Nội, Huế, Cao Bằng, Điện Biên, Hà Tĩnh, Lai Châu, Lạng Sơn, Nghệ An, Quảng Ninh, Thanh Hóa, Sơn La) have `mergedFrom: []` and `null` area/population | SECONDARY → needs PRIMARY | NQ 202/2025/QH15, Điều 1 khoản 1–24, read from the LuatVietnam PDF (note: the file read is an **English translation**, area/population "will have a natural area of … and a population of …"). Figures are as stated there; Điều 3 khoản 2 says the Government may update the areas after field survey. `mergedFrom` was cross-checked: it equals the distinct `formerProvince` of each province's codes for all 23. |
| 8 | `adminCenter` (trung tâm chính trị – hành chính) | **OPEN** | The NQ 202 text read does **not** state it → `null` for all 34. Do not show. |

**Last full review:** 2026-11-08 (claude.ai research). **Next review due:** 2027-02.

## Founder verification procedure
1. Get the official Phụ lục 02 of TT 51/2025/TT-BCA (Công báo PDF, or the Bộ Công an portal).
2. Compare it row by row with `data/plate-codes.json`, `provinces[].codes`.
3. Note the exact name written for code 75 and for code 80.
4. Approve the change of `verified:false` → `true`, and update row 1 to VERIFIED-PRIMARY.
