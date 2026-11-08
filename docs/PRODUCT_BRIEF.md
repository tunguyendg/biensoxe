# BIEN SO — Product Brief (MVP)

_Ngày: 08/11/2026 · Trạng thái: đề xuất, chờ Founder duyệt_

---

## 0. Kết luận trước

- **Có nhu cầu thật, nhưng hẹp.** Người dùng hỏi "biển số XX là tỉnh nào sau sáp nhập". Bằng chứng: Thư Viện Pháp Luật đã làm hẳn một trang cho từng mã (vd. "Biển số xe 83 là của tỉnh nào sau sáp nhập 2025?"). Đây là tín hiệu nhu cầu tìm kiếm rõ ràng.
- **Nhưng thông tin lõi chỉ là một bảng 35 dòng**, và Google + các trang luật đã trả lời được.
  - BIEN SO **không thắng nhờ dữ liệu**.
  - BIEN SO chỉ thắng nếu **nhanh hơn, rõ hơn, đáng tin hơn và dễ chia sẻ hơn** trên điện thoại.
- **Không nên kỳ vọng thành doanh nghiệp lớn.** Mục tiêu thực tế:
  - một tiện ích tra cứu chất lượng cao, chi phí gần 0;
  - một tài sản SEO nhỏ;
  - một sản phẩm portfolio thật.
- **Kiến trúc: site tĩnh.** Không cần API, không cần DB, không cần Docker trong production. Đây là quyết định quan trọng nhất của brief.
- **Kill/continue sau 8 tuần live:** đo bằng Google Search Console (xem mục 7).

---

## 1. Đối thủ & bài học

### Quốc tế — đều dựa trên sổ đăng ký xe chính thức (khác loại với chúng ta)

| Dịch vụ | Làm gì | Bài học cho BIEN SO |
|---|---|---|
| UK DVLA — Vehicle Enquiry | Nhập biển số → thuế xe, hạn MOT, năm sản xuất, nhiên liệu, khí thải. **Không hiện chủ xe**; muốn biết chủ xe phải gửi yêu cầu riêng tới DVLA. Nằm trong luồng "Buy a vehicle: step by step". | Một ô nhập duy nhất. Nói rõ cái gì **không** có. Đặt tra cứu vào đúng ngữ cảnh người dùng. |
| NL RDW — Kentekencheck | Miễn phí: số đời chủ, đánh giá số km, dữ liệu kỹ thuật/thuế. **Không hiện chủ xe vì quy định quyền riêng tư.** Có gói trả phí cho doanh nghiệp. | Minh bạch về quyền riêng tư làm tăng niềm tin. Free cho cá nhân. |
| Đức — danh sách Kfz-Kennzeichen (ADAC, kennzeichenking) | Bảng mã → thành phố/huyện → bang. Từ 2012 cho cấp lại mã cũ của các huyện đã giải thể (vd. KK). Mã đã ngừng cấp được đánh dấu kèm **mã kế thừa**. | **Tương đồng nhất với Việt Nam.** Sáp nhập hành chính làm mã cũ "sống tiếp" dưới đơn vị mới. Cách trình bày "mã cũ → đơn vị kế thừa" là mẫu cần học. |

**Khác biệt cốt lõi:** Việt Nam **không có** dịch vụ công khai tra dữ liệu xe theo biển số như DVLA/RDW. BIEN SO là **tra cứu mã địa lý**, không phải tra cứu xe. Phải nói điều này ngay trên giao diện.

### Việt Nam

- **thuvienphapluat.vn:** mỗi mã một trang hỏi–đáp.
  - Mạnh SEO và độ uy tín pháp lý.
  - Yếu UX mobile: nhiều chữ, quảng cáo, paywall/đăng nhập.
- **luatvietnam.vn:** bảng 34 tỉnh + mã đặc biệt + giải thích NG/NN/QT.
  - Đầy đủ nhưng là bài viết dài, không phải công cụ.
- **dulieuphapluat.vn:** có công cụ tra cứu. Em **không truy cập được** để kiểm chứng — Founder tự xem trước khi chốt định vị.
- **Khoảng trống:** chưa ai làm công cụ **mobile-first, trả lời trong 1 giây**, có giải thích "trước → nay" trực quan, ghi nguồn rõ, nói rõ giới hạn, và cho dán **cả biển số** (vd. `83A-123.45`).

---

## 2. Người dùng, nỗi đau, giá trị

### Nhóm người dùng (ưu tiên giảm dần)

1. **Người tò mò trên đường.** Thấy biển lạ, muốn biết xe "từ đâu".
   - Nhu cầu lớn nhất, tần suất cao, thao tác 5 giây trên điện thoại.
2. **Người vừa bị sáp nhập làm rối.**
   - Nhớ "83 là Sóc Trăng", giờ nghe "Cần Thơ".
   - Thắc mắc "tỉnh mình giờ có những mã nào", "biển cũ có phải đổi không".
3. **Người mua/bán xe cũ, tài xế, người làm logistics.** Muốn hiểu biển số nói gì và *không* nói gì.
4. **Học sinh, người chơi đố vui, người làm nội dung** (Tiktok, chơi đoán biển khi đi đường).

### Nỗi đau thật

- "Mã này là tỉnh nào **bây giờ**?" Và "trước đây là tỉnh nào?" — người ta nhớ theo tên cũ.
- Một tỉnh mới có nhiều mã (TP.HCM: 41, 50–59, 61, 72) → không nhớ nổi.
- **Hiểu sai nguy hiểm:** nghĩ mã biển = nơi chủ xe đang sống.
  - Thực tế từ 01/01/2025, chủ xe chuyển cư trú sang tỉnh khác **không bắt buộc đổi biển** theo Thông tư 79/2024/TT-BCA.
  - Biển số định danh còn gắn với chủ xe qua số định danh.
- "Biển cũ có phải đổi sau sáp nhập không?"
  - Thông tư 51/2025 thay bảng mã nhưng em **không tìm thấy điều khoản bắt đổi biển**.
  - Chỉ được nói điều này khi đã kiểm chứng văn bản gốc.

### Giá trị khác biệt — một câu

> **Gõ 2 số (hoặc dán cả biển) → biết ngay tỉnh hiện nay, tỉnh trước sáp nhập, và biển số này *không* cho biết điều gì — có nguồn văn bản đi kèm.**

### Vì sao dùng thay vì Google

- Nhanh hơn: không quảng cáo, không bài dài.
- Hiểu biển đầy đủ (`83A-123.45`).
- Trực quan "trước → nay".
- Một link gọn để chia sẻ (`/83`).
- Trang tỉnh gom đủ mã.
- Nói rõ giới hạn để không hiểu sai.

**Rủi ro định vị:** Google có thể trả lời thẳng trong snippet. Phòng thủ bằng hai thứ:
- trang `/[mã]` và `/tinh/[slug]` có nội dung tốt hơn để giành snippet;
- trải nghiệm đủ tốt để người dùng **bookmark/chia sẻ**.

---

## 3. MVP — làm gì, hoãn gì

### Trong MVP (P0)

1. **Ô tra cứu duy nhất** ở trang chủ, auto-focus, bàn phím số trên mobile (`inputmode`).
   - Chấp nhận: `83`, `83A`, `83A12345`, `83A-123.45`, `51G 123.45`, có/không dấu gạch, chữ thường.
   - Trích 2 số đầu.
2. **Thẻ kết quả**, gồm:
   - mã;
   - **tỉnh/thành hiện nay** (to nhất);
   - **trước 01/7/2025** (nếu khác);
   - các mã khác cùng tỉnh;
   - một dòng "Biển số này **không** cho biết chủ xe hay nơi chủ xe đang sống";
   - nguồn + ngày cập nhật dữ liệu.
3. **Trường hợp đặc biệt:**
   - mã 80 (Cục CSGT);
   - mã không tồn tại (vd. 13, 42, 87);
   - đầu vào là chữ NG/NN/QT hoặc biển quân đội (2 chữ cái) → giải thích ngắn, không đoán bừa.
4. **Trang tĩnh SEO:**
   - `/[mã]` cho tất cả mã (81 trang);
   - `/tinh/[slug]` cho 34 tỉnh/thành (liệt kê mã + tỉnh cũ đã gộp vào);
   - `/bang-ma` là bảng đầy đủ, lọc được, đọc tốt trên mobile.
5. **Trang "Nguồn & giới hạn"** (`/nguon`):
   - văn bản pháp lý, ngày kiểm chứng, phạm vi dữ liệu;
   - FAQ 4–6 câu (đổi biển? chuyển tỉnh? mã nhiều tỉnh? …), mỗi câu có trích nguồn.
6. **Chia sẻ:**
   - URL sạch;
   - ảnh OG theo mã (tạo lúc build);
   - nút "Chia sẻ" dùng Web Share API, fallback copy link.
7. **Cơ bản production:**
   - meta/OG, sitemap, robots, JSON-LD (FAQPage / Dataset gọn);
   - favicon, trang 404;
   - analytics không cookie (Cloudflare Web Analytics);
   - Google Search Console.

### Hoãn (P1+, chỉ làm khi có số liệu)

| Hoãn | Lý do |
|---|---|
| Ý nghĩa seri chữ (A, LD, KT…), màu nền biển | Có ích nhưng cần trích chính xác Điều 37 TT79/2024 và quy định BQP. Làm ở **M5** nếu kịp, không chặn launch. |
| Seri xe máy → quận/huyện (vd. 59-X1) | Cấp huyện đã bỏ từ 01/7/2025; không có nguồn chính thức công khai, dễ sai. **Không làm.** |
| Bản đồ tương tác | Đẹp nhưng nặng, không trả lời nhanh hơn. Thay bằng danh sách theo vùng. |
| Game đố biển số | Ý tưởng tăng chia sẻ tốt — V1.1 nếu traffic có. |
| PWA offline, app | Chưa có tín hiệu cần. |
| Tài khoản, lịch sử, API công khai, quảng cáo | Không phục vụ giá trị lõi. Quảng cáo xem lại khi có >10k lượt/tháng. |
| Tiếng Anh | Cho người nước ngoài/expat — P2, cùng kiến trúc i18n tĩnh. |

---

## 4. UX/UI

**Trải nghiệm mục tiêu:** mở link → con trỏ đã ở ô nhập → gõ "83" → kết quả hiện **ngay khi gõ đủ 2 số**, không cần bấm → đọc trong 3 giây → hiểu "Cần Thơ, trước là Sóc Trăng".

- **Phân cấp thông tin:**
  - Tỉnh hiện nay (rất to) → "Trước 01/7/2025: Sóc Trăng" (nhỏ hơn, có mũi tên) → mã cùng tỉnh (chip bấm được) → dòng giới hạn → nguồn.
  - Không dùng bảng cho kết quả đơn.
- **Hình ảnh biển số:** render mã vừa nhập trong khung giống biển thật (nền trắng, viền đen, font đậm dạng biển). Đây là "chữ ký" thị giác, nhận diện tức thì.
  - Tự vẽ bằng CSS/SVG, **không dùng ảnh biển thật**.
- **Phong cách:** nghiêm túc kiểu dịch vụ công tốt (gov.uk là chuẩn), nhưng ấm và hiện đại.
  - Một màu nhấn.
  - Chữ Việt hiển thị chuẩn (font có đủ dấu: Be Vietnam Pro / Inter).
  - Dark mode theo hệ thống.
- **Ngôn ngữ:**
  - tiếng Việt đời thường ("Biển 83 là xe đăng ký ở **Cần Thơ**");
  - không thuật ngữ hành chính trừ ở trang nguồn;
  - không viết "xe của người Cần Thơ".
- **Mobile trước:**
  - vùng chạm ≥ 44px;
  - kết quả nằm trên màn hình đầu ở 360×640;
  - không layout shift khi kết quả xuất hiện.
- **Tiếp cận:**
  - label thật cho ô nhập;
  - `aria-live` cho kết quả;
  - tương phản AA;
  - dùng được bằng bàn phím.
- **Lỗi thân thiện:**
  - "Mã 13 chưa được cấp cho tỉnh nào." Gợi ý mã gần / link bảng mã.
  - Không có trạng thái trống khó hiểu.

---

## 5. Kiến trúc

### Quyết định: Astro (SSG) + dữ liệu JSON trong repo + một island TypeScript nhỏ cho ô tra cứu. Deploy Cloudflare Pages.

**Lý do:**
- Dữ liệu ~81 dòng, thay đổi vài năm một lần → **build-time data**, không cần DB/API.
- Tra cứu chạy trên client từ JSON nhỏ (<10 KB) → tức thì, không backend để hỏng.
- SSG cho ~120 trang tĩnh → SEO tốt, tải cực nhanh, chi phí 0.
- Astro hợp Node/Mac M1, ít JS mặc định, dễ cho Claude Code.

| Phương án | Ưu | Nhược | Kết luận |
|---|---|---|---|
| **Astro SSG + JSON** | Nhanh, rẻ, ít hỏng, SEO tốt | Đổi dữ liệu cần rebuild (vài phút) | **Chọn** |
| Next.js | Quen thuộc | Nặng hơn mức cần, dễ trượt sang SSR không cần thiết | Không |
| Express + MySQL (cũ) | Đã có | Server + DB + Docker để phục vụ 81 dòng = chi phí và rủi ro vô lý | Không |
| HTML tay | Nhẹ nhất | Khó tạo 120 trang + sitemap + OG gọn | Không |

**Hosting:**
- Cloudflare Pages: free, CDN ở VN tốt, analytics không cookie.
- Phương án B: đẩy thư mục `dist/` lên shared hosting hiện có.
- Docker **không cần**.

**Kiểm thử:**
- Vitest kiểm toàn vẹn dữ liệu và parser biển số.
- Một smoke test build (đủ số trang, sitemap hợp lệ).
- Không e2e nặng trong MVP.

---

## 6. Dữ liệu, độ chính xác, niềm tin

### Nguồn

| Văn bản | Vai trò | Đã kiểm chứng |
|---|---|---|
| **Thông tư 51/2025/TT-BCA** (30/6/2025, hiệu lực 01/7/2025) | Sửa TT79/2024, **thay Phụ lục 02 — bảng ký hiệu biển số theo địa phương** | Ngày & hiệu lực: luatvietnam (bản văn). Bảng mã: qua bài tổng hợp luatvietnam — **chưa đối chiếu được bản Phụ lục gốc** |
| **Thông tư 79/2024/TT-BCA** | Quy định gốc về đăng ký, biển số; chuyển cư trú không bắt buộc đổi biển (từ 01/01/2025) | Qua lsvn.vn (Báo Luật sư VN) |
| **Nghị quyết 202/2025/QH15** | Sắp xếp 63 → 34 đơn vị hành chính cấp tỉnh | Có bản PDF trên luatvietnam |
| **Thông tư 37/2026/TT-BCA** (hiệu lực 08/6/2026) | Sửa nguyên tắc đăng ký: biển gắn số định danh, giữ biển 5 năm, giấy đăng ký điện tử trên VNeID/VNeTraffic | Qua lsvn.vn; **không thấy sửa bảng mã** |
| **Thông tư 62/2026/TT-BCA** | Sửa khoản 2 Điều 7 TT79 (thời hạn cấp) | Qua luatvietnam; **không thấy sửa bảng mã** |

### Bảng mã sau 01/7/2025 (theo bài tổng hợp TT51/2025)

- **Tỉnh có nhiều mã:**
  - An Giang 68, 67 · Bắc Ninh 99, 98 · Cà Mau 69, 94 · Cần Thơ 65, 83, 95
  - Đà Nẵng 43, 92 · Đắk Lắk 47, 78 · Đồng Nai 60, 39, 93 · Đồng Tháp 66, 63
  - Gia Lai 81, 77 · Hà Nội 29–33, 40 · Hải Phòng 15, 16, 34 · Hưng Yên 89, 17
  - Khánh Hòa 79, 85 · Lâm Đồng 49, 48, 86 · Lào Cai 24, 21 · Ninh Bình 35, 18, 90
  - Phú Thọ 19, 28, 88 · Quảng Ngãi 76, 82 · Quảng Trị 74, 73 · Tây Ninh 70, 62
  - Thái Nguyên 20, 97 · TP.HCM 41, 50–59, 61, 72 · Tuyên Quang 22, 23 · Vĩnh Long 64, 71, 84
- **Tỉnh một mã:** Cao Bằng 11 · Điện Biên 27 · Hà Tĩnh 38 · Huế 75 · Lai Châu 25 · Lạng Sơn 12 · Nghệ An 37 · Quảng Ninh 14 · Sơn La 26 · Thanh Hóa 36
- **Mã đặc biệt:** Cục CSGT 80.
- **Tổng:** 81 mã.

### Yêu cầu chính xác (chặn launch)

1. **Founder phải đối chiếu `data/plate-codes.json` với Phụ lục 02 bản gốc TT51/2025** (Công báo hoặc vbpl.moj.gov.vn, bản PDF/scan có chữ ký). Chưa đối chiếu = chưa launch.
2. Kiểm tra tên ghi trong Phụ lục cho mã 75: **"Thừa Thiên Huế" hay "Huế"**.
   - Bài tổng hợp ghi Thừa Thiên Huế, nhưng đơn vị này đã thành **thành phố Huế** từ 01/01/2025.
   - UI hiển thị theo tên hành chính hiện hành và ghi chú nếu Phụ lục khác.
3. Mỗi bản ghi có `verified: true|false`. Build **fail** nếu có bản ghi `verified: false` ở chế độ production.
4. Không khẳng định "không phải đổi biển sau sáp nhập" cho tới khi tìm được căn cứ. Trong lúc chờ, ghi: "Chưa thấy quy định bắt buộc đổi biển; liên hệ công an nơi đăng ký để chắc chắn."
5. Kiểm tra lại văn bản sửa đổi mới **mỗi quý** (ghi ngày kiểm trong `data/SOURCES.md`).

### Nguyên tắc niềm tin (hiển thị trên site)

- Biển số cho biết **nơi xe được đăng ký/cấp biển**, theo bảng mã hiện hành.
- **Không** cho biết: chủ xe, địa chỉ, nơi chủ xe đang sống, quận/xã, tình trạng xe.
- BIEN SO không thu thập biển số người dùng nhập.
  - Tra cứu chạy trên trình duyệt; không gửi về server.
  - Không log toàn bộ biển.
- Mỗi trang có "Cập nhật dữ liệu: dd/mm/yyyy · Nguồn: TT51/2025/TT-BCA".
- **Không phải trang của cơ quan nhà nước:** ghi rõ ở footer, không dùng logo/huy hiệu Công an.

---

## 7. Tiêu chí nghiệm thu MVP & checklist launch

### Acceptance criteria

- [ ] Nhập bất kỳ dạng nào trong mục 3.1 → đúng mã, đúng tỉnh hiện nay, đúng tỉnh trước (test bao phủ **toàn bộ 81 mã** + ≥15 định dạng đầu vào).
- [ ] Mã không tồn tại, chữ đặc biệt (NG/NN/QT), chuỗi rác → thông báo rõ, không crash, không đoán.
- [ ] Toàn vẹn dữ liệu:
  - 81 mã, không trùng;
  - đúng 34 tỉnh + 1 mã đặc biệt;
  - mọi mã thuộc đúng 1 tỉnh hiện nay;
  - mọi tỉnh cũ (63) xuất hiện ≥1 lần.
- [ ] Build tạo đủ: trang chủ, 81 `/[mã]`, 34 `/tinh/[slug]`, `/bang-ma`, `/nguon`, 404, sitemap.
- [ ] Mỗi trang kết quả có: dòng giới hạn, nguồn, ngày cập nhật.
- [ ] Mobile 360px: kết quả ở màn hình đầu, không cuộn ngang, chạm ≥44px.
- [ ] JS cho tra cứu ≤ 15 KB gzip; trang chủ tải được khi tắt JS (bảng mã vẫn đọc được).
- [ ] Lint, typecheck, test, build đều pass.

### Launch checklist (Founder)

- [ ] Đối chiếu Phụ lục 02 bản gốc → set `verified: true`
- [ ] Chọn & mua tên miền
- [ ] Duyệt giao diện trên điện thoại thật (iPhone + Android)
- [ ] Duyệt push/deploy (Cloudflare Pages)
- [ ] Đăng ký Google Search Console + gửi sitemap
- [ ] Bật Cloudflare Web Analytics

### Thước đo sau launch (8 tuần)

- **Tiếp tục đầu tư** nếu có cả hai:
  - ≥ 3.000 lượt hiển thị/tuần trên Search Console cho các truy vấn "biển số xe XX";
  - CTR ≥ 3%.
- **Dưới mức đó:** giữ nguyên làm tiện ích, không làm thêm tính năng.

---

## Nguồn tham khảo

- [Get vehicle information from DVLA — GOV.UK](https://www.gov.uk/get-vehicle-information-from-dvla)
- [RDW Kentekencheck](https://www.rdw.nl/uw-voertuig-en-uw-gegevens/informatie-over-uw-voertuig/kentekencheck)
- [ADAC — Kfz-Kennzeichen Deutschland](https://www.adac.de/rund-ums-fahrzeug/auto-kaufen-verkaufen/kfz-zulassung/kfz-kennzeichen-deutschland)
- [Thông tư 51/2025/TT-BCA — LuatVietnam](https://luatvietnam.vn/giao-thong/thong-tu-51-2025-tt-bca-sua-doi-quy-dinh-cap-thu-hoi-dang-ky-xe-va-bien-so-xe-404487-d1.html)
- [Quy định biển số xe 34 tỉnh từ 01/7/2025 — LuatVietnam](https://luatvietnam.vn/tin-van-ban-moi/quy-dinh-ve-bien-so-xe-cua-34-tinh-thanh-tu-01-7-2025-186-102811-article.html)
- [Bảng tra cứu biển số xe 34 tỉnh — LuatVietnam](https://luatvietnam.vn/hanh-chinh/bang-tra-cuu-bien-so-xe-cac-tinh-570-19547-article.html)
- [TT51/2025 bản .doc — vbpl.moj.gov.vn](https://vbpl.moj.gov.vn/TW/Lists/vbpq/Attachments/179019/C08TT51.doc)
- [Nghị quyết 202/2025/QH15 (PDF)](https://static3.luatvietnam.vn/uploaded/vietlawfile/2025/6/202_2025_qh15_130625135937.pdf)
- [Bỏ quy định đổi biển khi thay đổi nơi cư trú — LSVN](https://lsvn.vn/se-bo-quy-dinh-chu-xe-phai-doi-dang-ky-bien-so-khi-thay-doi-noi-cu-tru-a151376.html)
- [Một số thay đổi mới về đăng ký xe (TT37/2026) — LSVN](https://lsvn.vn/mot-so-thay-doi-moi-ve-dang-ky-xe-tu-hom-nay-a173933.html)
- [Ví dụ trang theo mã — Thư Viện Pháp Luật (mã 83/93)](https://thuvienphapluat.vn/hoi-dap-phap-luat/bien-so-xe-93-la-cua-tinh-nao-sau-sap-nhap-tinh-thanh-2025-138055863.html)
