#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const summaryPath = path.resolve(
  process.cwd(),
  "foundation/evaluation/metrics/data_quality_summary.json",
);
const sampleReadinessPath = path.resolve(
  process.cwd(),
  "foundation/evaluation/metrics/sample-mode-readiness.json",
);
const outputMdPath = path.resolve(
  process.cwd(),
  "foundation/evaluation/metrics/phase2-readiness-snapshot.md",
);
const outputJsonPath = path.resolve(
  process.cwd(),
  "foundation/evaluation/metrics/phase2-readiness-snapshot.json",
);

function readJsonOrNull(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function parseFlag(name, fallback = false) {
  const raw = process.env[name];
  if (raw === "1" || raw === "true" || raw === "TRUE") {
    return true;
  }
  if (raw === "0" || raw === "false" || raw === "FALSE") {
    return false;
  }
  return fallback;
}

const quality = readJsonOrNull(summaryPath);
const sample = readJsonOrNull(sampleReadinessPath);

const condition1 = parseFlag("READINESS_API_SOURCE_CONFIRMED", false);
const condition2 = parseFlag("READINESS_MAPPING_DRAFT_DONE", false);
const condition3 = Boolean(sample?.ready);
const condition4 = parseFlag("READINESS_FAILURE_RESPONSE_READY", true);

const allReady = condition1 && condition2 && condition3 && condition4;
const evaluatedAt = new Date().toISOString();

const snapshot = {
  conditions: {
    apiSourceConfirmed: condition1,
    mappingDraftDone: condition2,
    sampleModeStreakReady: condition3,
    failureResponseReady: condition4,
  },
  allReady,
  qualitySummary: quality,
  sampleReadiness: sample,
  evaluatedAt,
};

const md = `# Phase 2 Readiness Snapshot

- Evaluated At: ${evaluatedAt}
- All Conditions Ready: ${allReady ? "yes" : "no"}

## Conditions
- API source confirmed: ${condition1 ? "yes" : "no"}
- Mapping draft done: ${condition2 ? "yes" : "no"}
- Sample mode streak ready: ${condition3 ? "yes" : "no"}
- Failure response ready: ${condition4 ? "yes" : "no"}

## Quality Summary
- Ingest Success Rate: ${quality?.ingestSuccessRate ?? "n/a"}%
- Missing Rate: ${quality?.missingRate ?? "n/a"}%
- Duplicate Rate: ${quality?.duplicateRate ?? "n/a"}%
- Quarantine Rows: ${quality?.quarantineRows ?? "n/a"}

## Sample Readiness
- Streak: ${sample?.streak ?? "n/a"}
- Target: ${sample?.targetStreak ?? "n/a"}
- Ready: ${sample?.ready === true ? "yes" : sample?.ready === false ? "no" : "n/a"}
`;

fs.mkdirSync(path.dirname(outputMdPath), { recursive: true });
fs.writeFileSync(outputMdPath, md, "utf8");
fs.writeFileSync(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(`readiness_all_ready=${allReady}`);
console.log(`readiness_snapshot_md=foundation/evaluation/metrics/phase2-readiness-snapshot.md`);
console.log(`readiness_snapshot_json=foundation/evaluation/metrics/phase2-readiness-snapshot.json`);

