# LAUNCH — hướng dẫn deploy BIEN SO lên Cloudflare Pages

Mọi bước **push, deploy, gắn domain, bật `verified:true`** là việc của Founder (cần Founder tự quyết).
Quy ước: `DOMAIN` = tên miền cuối cùng, ví dụ `bienso.vn`. Không bao giờ đưa `ACCESSTRADE_TOKEN` lên Cloudflare.

## 0. Trước khi bắt đầu
- [ ] `npm run verify` xanh trên máy bạn.
- [ ] Đã quyết định `data/offers.json` (xem mục 8) và commit nó nếu muốn hiện khu affiliate.
- [ ] Repo đã có trên GitHub/GitLab (Cloudflare Pages kết nối Git). Root của repo = thư mục `bien_so`.

## 1. Cài đặt Cloudflare Pages (chính xác)
Workers & Pages → Create → **Pages** → Connect to Git → chọn repo.

| Mục | Giá trị |
|---|---|
| Production branch | `main` |
| Framework preset | `Astro` (hoặc `None`, cùng kết quả) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | để trống (repo gốc là `bien_so`) |
| Node version | `22` — đã có file `.node-version`; thêm biến `NODE_VERSION=22` cho chắc |

**Biến môi trường** (Settings → Variables and Secrets), đặt riêng cho **Production** và **Preview**:

| Biến | Production | Preview |
|---|---|---|
| `SITE_URL` | `https://DOMAIN` (không có dấu `/` cuối) | `https://<tên-dự-án>.pages.dev` |
| `BIEN_SO_STRICT` | `1` | **không đặt** |
| `PUBLIC_CF_ANALYTICS_TOKEN` | token Web Analytics (mục 6) | để trống |
| `NODE_VERSION` | `22` | `22` |

- **KHÔNG** đặt `ACCESSTRADE_TOKEN` (chỉ dùng trên máy bạn khi chạy `offers:links`).
- Build production có `BIEN_SO_STRICT=1` sẽ **fail có chủ đích** cho tới khi hết `verified:false` (mục 5) hoặc nếu `SITE_URL` thiếu/không phải https. Đó là hai lý do duy nhất; thông báo lỗi ghi rõ.
- Preview (không strict) vẫn build bản nháp: dòng nguồn có chữ " · đang đối chiếu bản gốc" và `noindex`, dùng để duyệt trên điện thoại thật.

## 2. Kiểm tra sau deploy (thay `HOST` bằng domain hoặc `xxx.pages.dev`)
`/83` được build thành file `83.html`; Cloudflare Pages phải phục vụ nó ở URL sạch `/83`.
```
curl -sI https://HOST/83                      # HTTP/2 200, content-type: text/html, KHÔNG có "location"
curl -sIL https://HOST/83 | grep -iE '^HTTP|^location'   # đúng 1 dòng HTTP (không chuyển hướng, không vòng)
curl -sI https://HOST/83.html                 # nếu có: 308 → /83 (một bước, đích 200)
curl -sI https://HOST/83/                     # 200 hoặc 308 → /83 một lần; KHÔNG được lặp
curl -s  https://HOST/13 | grep -c "Không tìm thấy"      # 404 thân thiện (≥ 1)
curl -sI https://HOST/og/83.png | grep -i content-type  # image/png
```
Quét cả sitemap (không dòng nào được in ra là đạt):
```
curl -s https://HOST/sitemap.xml | grep -o '<loc>[^<]*' | sed 's/<loc>//' | while read u; do
  r=$(curl -s -o /dev/null -w '%{http_code} %{num_redirects}' -L "$u"); [ "$r" = "200 0" ] || echo "$r $u"; done
```
(Với Preview, sitemap trỏ tới `SITE_URL` bạn đặt; nếu khác host thì thay thủ công.)

Header: `curl -sI https://HOST/` phải có `cache-control: public, max-age=0, must-revalidate`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()`. Một file trong `/_astro/` (xem trong HTML) phải có `cache-control: public, max-age=31536000, immutable`; `/og/83.png` có `max-age=2592000`. Nếu `/_astro/*` hiện cả `max-age=0` lẫn `immutable`, báo lại — đừng sửa tay.

**Nếu `/83` bị 404 hoặc vòng chuyển hướng:** dừng, không gắn domain; gửi kết quả các lệnh trên cho kỹ sư (cách xử lý là đổi `build.format`/`trailingSlash` trong `astro.config.ts` và các URL canonical/sitemap/`replaceState` theo).

## 3. Gắn domain (cần bạn duyệt/mua domain)
- [ ] Pages project → Custom domains → Set up a custom domain → nhập `DOMAIN`. Nếu domain đã ở Cloudflare DNS, bản ghi CNAME tự tạo; nếu không, thêm CNAME `@`/`www` theo hướng dẫn hiển thị.
- [ ] Chọn **một** host chính (apex hoặc `www`), redirect host còn lại về host chính (Rules → Redirect Rules).
- [ ] Đặt `SITE_URL=https://DOMAIN` (đúng host chính) trong Production → Retry deployment (biến này được nhúng lúc build).
- [ ] Lặp lại mục 2 với domain thật.

## 4. Search Console
- [ ] https://search.google.com/search-console → Add property → **Domain** (xác minh bằng bản ghi TXT DNS) hoặc URL prefix.
- [ ] Sitemaps → gửi `https://DOMAIN/sitemap.xml`.
- [ ] URL Inspection → "Request indexing" cho `/`, `/83`, `/bang-ma`.
- [ ] Trong lúc dữ liệu còn nháp, mọi trang có `noindex` — chưa lên chỉ mục là đúng. Trang chỉ được index sau build strict (mục 5).

## 5. Đối chiếu dữ liệu → bật `verified:true`
Làm theo [docs/FOUNDER_DATA_REVIEW.md](FOUNDER_DATA_REVIEW.md) (đối chiếu Phụ lục 02 với PDF Công báo, chốt tên mã 75, `npm run data:audit`, `npm run data:approve`).

Build strict (`BIEN_SO_STRICT=1`) chỉ qua khi: mọi bản ghi `verified:true`, `SITE_URL` là https, và `data/audit-result.json` có `dataSha256` trùng `data/plate-codes.json` hiện tại với 0 MISMATCH, 0 lỗi độ phủ. Sau khi duyệt: `SITE_URL=https://DOMAIN BIEN_SO_STRICT=1 npm run build` phải xanh, trang không còn " · đang đối chiếu bản gốc" lẫn `noindex`; push → Production build chạy xanh → làm lại mục 2.

## 6. Cloudflare Web Analytics (không cookie)
- [ ] Cloudflare → Analytics & Logs → Web Analytics → Add a site (hostname = `DOMAIN`) → chọn cách "Manual/JS snippet" → copy **token** trong `data-cf-beacon`.
- [ ] Đặt `PUBLIC_CF_ANALYTICS_TOKEN` (Production) → Retry deployment. Không có biến này thì **không có script nào** được chèn.

## 7. Chu kỳ 2 tuần — offers
Mỗi 2 tuần (đặt nhắc lịch): `npm run offers:check` → commit `data/offers.json` → push. Offer quá 30 ngày kể từ `checkedAt` tự ẩn lúc build. Khi đổi `data/offers.config.json`: `npm run offers:links` rồi `offers:check`. Chi tiết: `docs/AFFILIATE.md`. Token chỉ ở `.env` trên máy bạn.

## 8. Rollback
Pages → Deployments → chọn bản trước → Rollback to this deployment.

## 9. Checklist launch (từ PRODUCT_BRIEF §7)
Việc của Founder:
- [ ] Đối chiếu Phụ lục 02 bản gốc → `verified: true` (mục 5)
- [ ] Chọn & mua tên miền (mục 3)
- [ ] Duyệt giao diện trên điện thoại thật: iPhone (Safari) + Android (Chrome), cả chế độ sáng và tối, ở trang Preview
- [ ] Duyệt push/deploy (Cloudflare Pages, mục 1)
- [ ] Đăng ký Google Search Console + gửi sitemap (mục 4)
- [ ] Bật Cloudflare Web Analytics (mục 6)

Tiêu chí nghiệm thu MVP (máy đã kiểm bằng `npm run verify`, trừ các mục ghi "tay"):
- [x] Đúng mã/tỉnh hiện nay/tỉnh trước cho cả 81 mã, ≥ 15 định dạng nhập (test)
- [x] Mã không tồn tại, NG/NN/QT, rác → thông báo rõ, không đoán (test)
- [x] Toàn vẹn dữ liệu: 81 mã, 34 tỉnh + mã 80, mỗi mã đúng 1 tỉnh, 63 đơn vị cũ (test)
- [x] Build đủ: home, 81 `/[mã]`, 34 `/tinh/[slug]`, `/bang-ma`, `/nguon`, 404, sitemap (smoke test)
- [x] Mỗi trang kết quả có dòng giới hạn, nguồn, ngày dữ liệu (smoke test)
- [ ] Mobile 360px: kết quả ở màn hình đầu, không cuộn ngang, chạm ≥ 44px (tay — duyệt trên máy thật)
- [x] JS tra cứu ≤ 15 KB gzip; trang dùng được khi tắt JS (bảng mã đọc được)
- [x] Lint, typecheck, test, build đều pass

Sau launch: theo dõi 8 tuần — tiếp tục đầu tư nếu ≥ 3.000 lượt hiển thị/tuần trên Search Console cho các truy vấn "biển số xe XX" **và** CTR ≥ 3%; dưới mức đó giữ nguyên làm tiện ích.
