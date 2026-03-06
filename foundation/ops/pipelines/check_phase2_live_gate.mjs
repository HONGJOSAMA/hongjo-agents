#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const snapshotPath = path.resolve(
  process.cwd(),
  process.env.PHASE2_READINESS_SNAPSHOT || "foundation/evaluation/metrics/phase2-readiness-snapshot.json",
);
const gateReportMdPath = path.resolve(
  process.cwd(),
  process.env.PHASE2_LIVE_GATE_REPORT_MD || "foundation/evaluation/metrics/phase2-live-gate-report.md",
);
const gateReportJsonPath = path.resolve(
  process.cwd(),
  process.env.PHASE2_LIVE_GATE_REPORT_JSON || "foundation/evaluation/metrics/phase2-live-gate-report.json",
);
const snapshotPathRelative = path.relative(process.cwd(), snapshotPath);
const gateReportMdRelative = path.relative(process.cwd(), gateReportMdPath);
const gateReportJsonRelative = path.relative(process.cwd(), gateReportJsonPath);

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`snapshot_missing:${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isTruthy(raw) {
  return raw === "1" || raw === "true" || raw === "TRUE";
}

const strict = isTruthy(process.env.PHASE2_LIVE_GATE_STRICT || "1");
const minIngest = Number(process.env.PIPELINE_MIN_INGEST_SUCCESS_RATE || 95);
const maxMissing = Number(process.env.PIPELINE_MAX_MISSING_RATE || 5);
const maxDuplicate = Number(process.env.PIPELINE_MAX_DUPLICATE_RATE || 2);

let snapshot;
try {
  snapshot = readJson(snapshotPath);
} catch (error) {
  console.log(`phase2_live_gate_error=${String(error?.message || error)}`);
  fs.mkdirSync(path.dirname(gateReportMdPath), { recursive: true });
  fs.writeFileSync(
    gateReportMdPath,
    `# Phase 2 Live Gate Report\n\n- Status: fail\n- Error: ${String(error?.message || error)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    gateReportJsonPath,
    `${JSON.stringify(
      {
        passed: false,
        error: String(error?.message || error),
        evaluatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  process.exitCode = 1;
  process.exit();
}

const quality = snapshot.qualitySummary || {};
const conditions = snapshot.conditions || {};
const failures = [];
const evaluatedAt = new Date().toISOString();

if (!conditions.apiSourceConfirmed) {
  failures.push("condition_failed:apiSourceConfirmed");
}
if (!conditions.mappingDraftDone) {
  failures.push("condition_failed:mappingDraftDone");
}
if (!conditions.sampleModeStreakReady) {
  failures.push("condition_failed:sampleModeStreakReady");
}
if (!conditions.failureResponseReady) {
  failures.push("condition_failed:failureResponseReady");
}

if (typeof quality.ingestSuccessRate === "number" && quality.ingestSuccessRate < minIngest) {
  failures.push(`quality_failed:ingestSuccessRate<${minIngest}`);
}
if (typeof quality.missingRate === "number" && quality.missingRate > maxMissing) {
  failures.push(`quality_failed:missingRate>${maxMissing}`);
}
if (typeof quality.duplicateRate === "number" && quality.duplicateRate > maxDuplicate) {
  failures.push(`quality_failed:duplicateRate>${maxDuplicate}`);
}

const passed = failures.length === 0;
const report = {
  passed,
  strict,
  snapshotPath: snapshotPathRelative,
  thresholds: {
    minIngest,
    maxMissing,
    maxDuplicate,
  },
  conditions,
  quality,
  failures,
  evaluatedAt,
};

const reportMd = `# Phase 2 Live Gate Report

- Status: ${passed ? "pass" : "fail"}
- Strict Mode: ${strict}
- Evaluated At: ${evaluatedAt}
- Snapshot: \`${snapshotPathRelative}\`

## Thresholds
- ingest success >= ${minIngest}
- missing rate <= ${maxMissing}
- duplicate rate <= ${maxDuplicate}

## Conditions
- apiSourceConfirmed: ${conditions.apiSourceConfirmed ? "yes" : "no"}
- mappingDraftDone: ${conditions.mappingDraftDone ? "yes" : "no"}
- sampleModeStreakReady: ${conditions.sampleModeStreakReady ? "yes" : "no"}
- failureResponseReady: ${conditions.failureResponseReady ? "yes" : "no"}

## Quality
- ingestSuccessRate: ${quality.ingestSuccessRate ?? "n/a"}
- missingRate: ${quality.missingRate ?? "n/a"}
- duplicateRate: ${quality.duplicateRate ?? "n/a"}

## Failures
${failures.length === 0 ? "- none" : failures.map((f) => `- ${f}`).join("\n")}
`;

fs.mkdirSync(path.dirname(gateReportMdPath), { recursive: true });
fs.writeFileSync(gateReportMdPath, reportMd, "utf8");
fs.writeFileSync(gateReportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`phase2_live_gate_passed=${passed}`);
console.log(`phase2_live_gate_strict=${strict}`);
console.log(`phase2_live_gate_snapshot=${snapshotPathRelative}`);
console.log(`phase2_live_gate_failures=${failures.length}`);
console.log(`phase2_live_gate_report_md=${gateReportMdRelative}`);
console.log(`phase2_live_gate_report_json=${gateReportJsonRelative}`);
for (const item of failures) {
  console.log(`phase2_live_gate_detail=${item}`);
}

if (!passed && strict) {
  process.exitCode = 1;
}
