#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const snapshotPath = path.resolve(
  process.cwd(),
  process.env.PHASE2_READINESS_SNAPSHOT || "foundation/evaluation/metrics/phase2-readiness-snapshot.json",
);

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
  process.exitCode = 1;
  process.exit();
}

const quality = snapshot.qualitySummary || {};
const conditions = snapshot.conditions || {};
const failures = [];

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
console.log(`phase2_live_gate_passed=${passed}`);
console.log(`phase2_live_gate_strict=${strict}`);
console.log(`phase2_live_gate_snapshot=${snapshotPath}`);
console.log(`phase2_live_gate_failures=${failures.length}`);
for (const item of failures) {
  console.log(`phase2_live_gate_detail=${item}`);
}

if (!passed && strict) {
  process.exitCode = 1;
}

