#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const quarantinePath = path.resolve(
  process.cwd(),
  process.env.QUARANTINE_INPUT || "foundation/data/quarantine/phase2-quarantine-latest.jsonl",
);
const replayOutputPath = path.resolve(
  process.cwd(),
  process.env.QUARANTINE_REPLAY_OUTPUT || "foundation/data/quarantine/phase2-replay-output.jsonl",
);
const replayReportPath = path.resolve(
  process.cwd(),
  process.env.QUARANTINE_REPLAY_REPORT || "foundation/evaluation/metrics/quarantine-replay-report.md",
);

function parseJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function sanitizeRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return {
    ...raw,
    organizationId: raw.organizationId || process.env.PIPELINE_ORGANIZATION_ID || "org-demo-001",
    domainKey: raw.domainKey || process.env.PIPELINE_DEFAULT_DOMAIN_KEY || "cyber_information",
    observedAt: raw.observedAt || raw.createdAt || new Date().toISOString(),
    createdAt: raw.createdAt || raw.observedAt || new Date().toISOString(),
  };
}

function isReplayValid(record) {
  if (!record) {
    return false;
  }
  if (!record.id || !record.organizationId || !record.entityType) {
    return false;
  }
  if (["Observation", "Hypothesis", "Prediction", "Dissent"].includes(record.entityType) && !record.domainKey) {
    return false;
  }
  return true;
}

function toMarkdown(summary) {
  return `# Quarantine Replay Report

- Source: \`foundation/data/quarantine/phase2-quarantine-latest.jsonl\`
- Replay Output: \`foundation/data/quarantine/phase2-replay-output.jsonl\`
- Total Quarantine Rows: ${summary.total}
- Replayed Rows: ${summary.replayed}
- Unresolved Rows: ${summary.unresolved}
`;
}

const quarantinedRows = parseJsonl(quarantinePath);
const replayed = [];
const unresolved = [];

for (const row of quarantinedRows) {
  const repaired = sanitizeRecord(row.raw);
  if (isReplayValid(repaired)) {
    replayed.push({
      replayedAt: new Date().toISOString(),
      originalReason: row.reason || "unknown",
      record: repaired,
    });
  } else {
    unresolved.push(row);
  }
}

fs.mkdirSync(path.dirname(replayOutputPath), { recursive: true });
fs.mkdirSync(path.dirname(replayReportPath), { recursive: true });

fs.writeFileSync(
  replayOutputPath,
  `${replayed.map((row) => JSON.stringify(row)).join("\n")}${replayed.length > 0 ? "\n" : ""}`,
  "utf8",
);

const summary = {
  total: quarantinedRows.length,
  replayed: replayed.length,
  unresolved: unresolved.length,
};
fs.writeFileSync(replayReportPath, toMarkdown(summary), "utf8");

console.log(`quarantine_total=${summary.total}`);
console.log(`replayed=${summary.replayed}`);
console.log(`unresolved=${summary.unresolved}`);
console.log(`replay_output=foundation/data/quarantine/phase2-replay-output.jsonl`);
console.log(`replay_report=foundation/evaluation/metrics/quarantine-replay-report.md`);

if (summary.unresolved > 0) {
  process.exitCode = 1;
}
