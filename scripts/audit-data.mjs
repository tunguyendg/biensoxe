#!/usr/bin/env node
// BIEN SO — legal data audit. Read-only: never edits data/plate-codes.json.
// Compares every record against transcribed legal sources in data/sources/:
//   tt51-2025-phu-luc-02.json  (current code table, effective 01/07/2025)
//   tt79-2024-phu-luc-02.json  (pre-merger code table → "former province")
//   nq202-2025.json            (which former units merged into which new unit)
// Default: writes docs/DATA_AUDIT.md + data/audit-result.json (only when the content differs from the
// stored result, ignoring auditedAt). Exit 1 if any MISMATCH or coverage issue.
// --check: writes nothing; also fails if data/audit-result.json is missing or stale (dataSha256 / content).
// Usage: node scripts/audit-data.mjs [--check] [--root .]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.argv.includes("--root") ? process.argv[process.argv.indexOf("--root") + 1] : ".";
const CHECK = process.argv.includes("--check");
const rd = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const rawData = readFileSync(join(root, "data/plate-codes.json"), "utf8");
const data = JSON.parse(rawData);
const tt51 = rd("data/sources/tt51-2025-phu-luc-02.json");
const tt79 = rd("data/sources/tt79-2024-phu-luc-02.json");
const nq = rd("data/sources/nq202-2025.json");

// ---- name normalisation (tone-mark placement, dashes, aliases) ----
const ALIASES = new Map([
  ["thua thien hue", "hue"], // TT51 appendix wording vs NQ 202 "thành phố Huế"
  ["thanh pho ho chi minh", "tp ho chi minh"], ["tp hcm", "tp ho chi minh"], ["ho chi minh", "tp ho chi minh"],
  ["dien bien", "dien bien"], ["bac can", "bac kan"],
]);
export function norm(s) {
  if (s == null) return "";
  let t = s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  t = t.replace(/[.\-–—]/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/^(tinh|thanh pho)\s+/, "");
  return ALIASES.get(t) ?? t;
}
const same = (a, b) => norm(a) === norm(b);

// ---- index sources ----
const codeTo51 = new Map(); tt51.units.forEach((u) => u.codes.forEach((c) => codeTo51.set(c, u.name)));
const special51 = new Map(); tt51.special.forEach((u) => u.codes.forEach((c) => special51.set(c, u.name)));
const codeTo79 = new Map(); tt79.units.forEach((u) => u.codes.forEach((c) => codeTo79.set(c, u.name)));
const merged = new Map(nq.merged.map((m) => [norm(m.name), m.from]));
const unchanged = new Set(nq.unchanged.map(norm));
const provBySlug = new Map(data.provinces.map((p) => [p.slug, p]));

const results = [];
const push = (r) => results.push(r);

// ---- code records ----
for (const c of data.codes) {
  const id = `code:${c.code}`; const issues = []; const notes = [];
  if (c.type === "special") {
    const s = special51.get(c.code);
    if (!s) issues.push(`Mã ${c.code} không có trong mục đặc biệt của TT51`);
    if (c.currentProvince) issues.push("Mã đặc biệt không được gắn tỉnh");
    if (s && c.label && !same(c.label.replace(/\s*\(.*\)\s*/, ""), s)) issues.push(`Nhãn "${c.label}" ≠ TT51 "${s}"`);
    if (s) notes.push(`TT51: ${s}`);
    if (codeTo79.has(c.code)) issues.push("TT79 lại gán mã này cho một tỉnh");
  } else {
    const p = provBySlug.get(c.currentProvince);
    const cur51 = codeTo51.get(c.code); const old79 = codeTo79.get(c.code);
    if (!p) issues.push(`currentProvince "${c.currentProvince}" không tồn tại`);
    if (!cur51) issues.push(`Mã ${c.code} không có trong Phụ lục 02 TT51`);
    else if (p && !same(p.name, cur51)) issues.push(`Tỉnh hiện nay "${p.name}" ≠ TT51 "${cur51}"`);
    if (!old79) issues.push(`Mã ${c.code} không có trong Phụ lục 02 TT79 (không kiểm được tỉnh cũ)`);
    else if (!same(c.formerProvince, old79)) issues.push(`Tỉnh cũ "${c.formerProvince}" ≠ TT79 "${old79}"`);
    // chain: TT79 unit must be part of the NQ202 merger of the TT51 unit
    if (cur51 && old79) {
      const from = merged.get(norm(cur51));
      if (from) { if (!from.some((f) => same(f, old79))) issues.push(`NQ202 không ghi "${old79}" hợp nhất vào "${cur51}"`); }
      else if (unchanged.has(norm(cur51))) { if (!same(cur51, old79)) issues.push(`"${cur51}" không đổi theo NQ202 nhưng mã thuộc "${old79}"`); }
      else issues.push(`"${cur51}" không có trong NQ202`);
    }
    if (cur51 && norm(cur51) === "hue") notes.push('Phụ lục TT51 ghi "Thừa Thiên Huế"; NQ202 gọi là "thành phố Huế" — tên hiển thị cần Founder chốt');
    if (old79) notes.push(`TT79: ${old79} → TT51: ${cur51 ?? "?"}`);
  }
  push({ id, kind: "code", verified: !!c.verified, verdict: issues.length ? "MISMATCH" : notes.some((n) => n.includes("Founder")) ? "MATCH_NEEDS_DECISION" : "MATCH", issues, notes });
}

// ---- province records ----
for (const p of data.provinces) {
  const id = `province:${p.slug}`; const issues = []; const notes = []; const info = [];
  const u51 = tt51.units.find((u) => same(u.name, p.name));
  if (!u51) issues.push(`Tên "${p.name}" không có trong TT51`);
  else {
    const a = [...p.codes].sort().join(","), b = [...u51.codes].sort().join(",");
    if (a !== b) issues.push(`Mã [${a}] ≠ TT51 [${b}]`);
  }
  const from = merged.get(norm(p.name)); const isUnchanged = unchanged.has(norm(p.name));
  if (!from && !isUnchanged) issues.push("Không có trong NQ202 (hợp nhất hay không đổi)");
  const expectedFormer = from ? from.filter((f) => !same(f, p.name)) : [];
  if (Array.isArray(p.formerProvinces)) {
    const a = p.formerProvinces.map(norm).sort().join("|"), b = expectedFormer.map(norm).sort().join("|");
    if (a !== b) issues.push(`formerProvinces [${p.formerProvinces.join(", ")}] ≠ NQ202 [${expectedFormer.join(", ")}]`);
  }
  if (Array.isArray(p.mergedFrom)) {
    const exp = from ?? [];
    const a = p.mergedFrom.map(norm).sort().join("|"), b = exp.map(norm).sort().join("|");
    if (a !== b) issues.push(`mergedFrom [${p.mergedFrom.join(", ")}] ≠ NQ202 [${exp.join(", ")}]`);
  }
  if (p.adminCenter != null) issues.push(`adminCenter "${p.adminCenter}" không có nguồn (NQ202 không ghi trung tâm hành chính)`);
  if (p.areaKm2 != null || p.population != null) info.push("Có areaKm2/population: KHÔNG kiểm trong đợt này — đang ẩn trên site, không dùng làm điều kiện verified");
  if (norm(p.name) === "hue") notes.push('Phụ lục TT51 ghi "Thừa Thiên Huế"; NQ202 ghi "thành phố Huế" — Founder chốt tên hiển thị');
  if (p.region) info.push(`region "${p.region}" là phân nhóm biên tập, không phải dữ liệu pháp lý`);
  push({ id, kind: "province", verified: !!p.verified, verdict: issues.length ? "MISMATCH" : notes.length ? "MATCH_NEEDS_DECISION" : "MATCH", issues, notes, info });
}

// ---- coverage ----
const coverage = [];
const ours = new Set(data.codes.map((c) => c.code));
const all51 = new Set([...codeTo51.keys(), ...special51.keys()]);
for (const c of all51) if (!ours.has(c)) coverage.push(`Thiếu mã ${c} có trong TT51`);
for (const c of ours) if (!all51.has(c)) coverage.push(`Thừa mã ${c} không có trong TT51`);
const formerSeen = new Set(data.codes.filter((c) => c.formerProvince).map((c) => norm(c.formerProvince)));
for (const u of tt79.units) if (!formerSeen.has(norm(u.name))) coverage.push(`Tỉnh cũ "${u.name}" (TT79) không xuất hiện trong dữ liệu`);
if (data.codes.length + data.provinces.length !== results.length) coverage.push("Số bản ghi không khớp");
// cross-source sanity: TT51 = regrouping of TT79 per NQ202 (catches transcription errors in the sources themselves)
for (const c of codeTo79.keys()) { const n51 = codeTo51.get(c); if (!n51) coverage.push(`Nguồn: mã ${c} có ở TT79 nhưng không có ở TT51`); }

// ---- summary ----
const count = (k, v) => results.filter((r) => r.kind === k && r.verdict === v).length;
const sha = createHash("sha256").update(rawData).digest("hex");
const summary = {
  auditedAt: new Date().toISOString(), dataSha256: sha,
  totals: { records: results.length, codes: data.codes.length, provinces: data.provinces.length,
    codeProvince: data.codes.filter((c) => c.type !== "special").length, codeSpecial: data.codes.filter((c) => c.type === "special").length,
    verifiedTrue: results.filter((r) => r.verified).length },
  verdicts: Object.fromEntries(["MATCH", "MATCH_NEEDS_DECISION", "MISMATCH"].map((v) => [v, { code: count("code", v), province: count("province", v) }])),
  coverage, sources: { tt51: tt51.meta, tt79: tt79.meta, nq202: nq.meta },
};
const fresh = { summary, results };
const resultPath = join(root, "data/audit-result.json");
const stored = existsSync(resultPath) ? JSON.parse(readFileSync(resultPath, "utf8")) : null;
const withoutTime = (o) => JSON.stringify({ ...o, summary: { ...o.summary, auditedAt: undefined } });
const sameAsStored = stored !== null && withoutTime(stored) === withoutTime(fresh);
const failed = results.some((r) => r.verdict === "MISMATCH") || coverage.length > 0;
const line = `records=${summary.totals.records} MATCH=${summary.verdicts.MATCH.code + summary.verdicts.MATCH.province} NEEDS_DECISION=${summary.verdicts.MATCH_NEEDS_DECISION.code + summary.verdicts.MATCH_NEEDS_DECISION.province} MISMATCH=${summary.verdicts.MISMATCH.code + summary.verdicts.MISMATCH.province} coverage_issues=${coverage.length}`;
if (CHECK) {
  console.log(line);
  if (failed) { console.error("✗ Audit còn MISMATCH hoặc lỗi độ phủ (xem docs/DATA_AUDIT.md sau khi chạy npm run data:audit)."); process.exit(1); }
  if (!stored) { console.error("✗ Thiếu data/audit-result.json — chạy npm run data:audit."); process.exit(1); }
  if (stored.summary?.dataSha256 !== sha) { console.error("✗ data/audit-result.json cũ: dataSha256 không khớp data/plate-codes.json — chạy npm run data:audit."); process.exit(1); }
  if (!sameAsStored) { console.error("✗ data/audit-result.json không khớp kết quả audit hiện tại (nguồn hoặc script đã đổi) — chạy npm run data:audit."); process.exit(1); }
  process.exit(0);
}

if (sameAsStored && existsSync(join(root, "docs/DATA_AUDIT.md"))) {
  console.log(line + " (không đổi, không ghi file)");
  process.exit(failed ? 1 : 0);
}
mkdirSync(join(root, "docs"), { recursive: true });
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(resultPath, JSON.stringify(fresh, null, 2) + "\n");
const L = [];
L.push("# Báo cáo kiểm tra dữ liệu (tự động)", "", `Thời điểm: ${summary.auditedAt} · SHA-256 data/plate-codes.json: \`${sha.slice(0, 16)}…\``, "");
L.push("> Công cụ chỉ ĐỌC dữ liệu. Kết quả MATCH nghĩa là khớp với bản chép nguồn trong `data/sources/`. Bản chép là nguồn thứ cấp (toàn văn trên LuatVietnam/Thư Viện Pháp Luật) cho tới khi Founder đối chiếu PDF Công báo.", "");
L.push("## Tổng quan", "", `- Tổng bản ghi: **${summary.totals.records}** = ${summary.totals.codes} mã (${summary.totals.codeProvince} mã tỉnh + ${summary.totals.codeSpecial} mã đặc biệt) + ${summary.totals.provinces} tỉnh/thành`);
L.push(`- Đã verified:true: ${summary.totals.verifiedTrue}`);
for (const v of ["MATCH", "MATCH_NEEDS_DECISION", "MISMATCH"]) L.push(`- ${v}: ${summary.verdicts[v].code} mã, ${summary.verdicts[v].province} tỉnh`);
L.push(`- Độ phủ: ${coverage.length ? coverage.map((x) => "\n  - " + x).join("") : "đủ 81 mã TT51, đủ 63 tỉnh cũ TT79, không thừa/thiếu"}`, "");
const bad = results.filter((r) => r.verdict !== "MATCH");
L.push("## Cần xem", "", bad.length ? "" : "_Không có._");
for (const r of bad) L.push(`- **${r.id}** — ${r.verdict}${r.issues.length ? ": " + r.issues.join("; ") : ""}${r.notes.length ? " · " + r.notes.join("; ") : ""}`);
L.push("", "## Chi tiết từng mã", "", "| Mã | Kết quả | Đối chiếu |", "|---|---|---|");
for (const r of results.filter((r) => r.kind === "code")) L.push(`| ${r.id.slice(5)} | ${r.verdict} | ${[...r.issues, ...r.notes].join("; ")} |`);
L.push("", "## Chi tiết từng tỉnh", "", "| Tỉnh | Kết quả | Ghi chú |", "|---|---|---|");
for (const r of results.filter((r) => r.kind === "province")) L.push(`| ${r.id.slice(9)} | ${r.verdict} | ${[...r.issues, ...r.notes, ...(r.info ?? [])].join("; ")} |`);
L.push("", "## Nguồn", "");
for (const s of Object.values(summary.sources)) L.push(`- ${s.document} — ${s.status}${s.transcribedFrom ? ` — ${s.transcribedFrom}` : ""}${s.gazetteUrl ? ` — Công báo: ${s.gazetteUrl}` : ""}${s.pdf ? ` — ${s.pdf}` : ""}`);
writeFileSync(join(root, "docs/DATA_AUDIT.md"), L.join("\n") + "\n");

console.log(line);
process.exit(failed ? 1 : 0);
