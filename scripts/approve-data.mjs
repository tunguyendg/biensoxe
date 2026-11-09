#!/usr/bin/env node
// BIEN SO — Founder approval step. Flips verified:false → true ONLY when:
//   1. data/audit-result.json exists and its dataSha256 equals the current data/plate-codes.json
//      (data cannot change between audit and approval),
//   2. the audit has 0 MISMATCH and 0 coverage issues,
//   3. every MATCH_NEEDS_DECISION record has a decision in data/DECISIONS.json,
//   4. the Founder passes --founder-approved AND --gazette-checked (he compared the Công báo PDF).
// Agents must never run this with those flags on their own initiative.
// Usage: node scripts/approve-data.mjs --founder-approved --gazette-checked [--dry-run]
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";

const args = new Set(process.argv.slice(2));
const fail = (m) => { console.error("✗ " + m); process.exit(1); };
const raw = readFileSync("data/plate-codes.json", "utf8");
const sha = createHash("sha256").update(raw).digest("hex");
if (!existsSync("data/audit-result.json")) fail("Chưa có data/audit-result.json — chạy npm run data:audit trước.");
const audit = JSON.parse(readFileSync("data/audit-result.json", "utf8"));
if (audit.summary.dataSha256 !== sha) fail("Dữ liệu đã đổi sau lần audit — chạy lại npm run data:audit.");
const bad = audit.results.filter((r) => r.verdict === "MISMATCH");
if (bad.length || audit.summary.coverage.length) fail(`Audit còn ${bad.length} MISMATCH, ${audit.summary.coverage.length} lỗi độ phủ.`);
const decisions = existsSync("data/DECISIONS.json") ? JSON.parse(readFileSync("data/DECISIONS.json", "utf8")) : {};
const pending = audit.results.filter((r) => r.verdict === "MATCH_NEEDS_DECISION" && !decisions[r.id]);
if (pending.length) fail(`Thiếu quyết định của Founder trong data/DECISIONS.json cho: ${pending.map((r) => r.id).join(", ")}`);
if (!args.has("--founder-approved") || !args.has("--gazette-checked"))
  fail("Cần cả --founder-approved và --gazette-checked (Founder đã đối chiếu PDF Công báo 887+888).");

const data = JSON.parse(raw);
let n = 0;
for (const c of data.codes) if (!c.verified) { c.verified = true; n++; }
for (const p of data.provinces) if (!p.verified) { p.verified = true; n++; }
if (args.has("--dry-run")) { console.log(`(dry-run) sẽ bật verified cho ${n} bản ghi.`); process.exit(0); }
writeFileSync("data/plate-codes.json", JSON.stringify(data, null, 2) + "\n");
const day = new Date().toISOString().slice(0, 10);
appendFileSync("data/SOURCES.md", `\n- ${day}: Founder duyệt ${n} bản ghi (audit sha ${sha.slice(0, 12)}); đối chiếu PDF Công báo 887+888 (TT 51/2025/TT-BCA, Phụ lục 02). Quyết định: ${JSON.stringify(decisions)}\n`);
console.log(`✓ Đã bật verified cho ${n} bản ghi. Commit data/plate-codes.json + data/SOURCES.md.`);
