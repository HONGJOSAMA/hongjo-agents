#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const replayInputPath = path.resolve(
  process.cwd(),
  process.env.QUARANTINE_REPLAY_OUTPUT || "foundation/data/quarantine/phase2-replay-output.jsonl",
);
const normalizedPath = path.resolve(
  process.cwd(),
  process.env.NORMALIZED_OUTPUT || "foundation/data/normalized/phase2-normalized-sample.jsonl",
);
const reportPath = path.resolve(
  process.cwd(),
  process.env.REINJECT_REPORT || "foundation/evaluation/metrics/reinject-replay-report.md",
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

function normalizeForIngest(record) {
  return {
    entityType: record.entityType ?? null,
    organizationId: record.organizationId ?? null,
    domainKey: record.domainKey ?? null,
    eventTime: record.observedAt ?? record.createdAt ?? null,
    quality: {
      confidence: typeof record.confidence === "number" ? record.confidence : null,
      trustScore: typeof record.trustScore === "number" ? record.trustScore : null,
      piiFlag: Boolean(record.piiFlag),
    },
    raw: record,
  };
}

const replayRows = parseJsonl(replayInputPath);
const replayRecords = replayRows
  .map((row) => row.record)
  .filter((row) => row && typeof row === "object");

const existingNormalized = parseJsonl(normalizedPath);
const existingIds = new Set(existingNormalized.map((r) => r.raw?.id).filter(Boolean));

const toInject = [];
for (const record of replayRecords) {
  const id = record.id;
  if (id && existingIds.has(id)) {
    continue;
  }
  if (id) {
    existingIds.add(id);
  }
  toInject.push(normalizeForIngest(record));
}

if (toInject.length > 0) {
  const appendBody = `${toInject.map((row) => JSON.stringify(row)).join("\n")}\n`;
  fs.appendFileSync(normalizedPath, appendBody, "utf8");
}

const markdown = `# Replay Reinject Report

- Replay Input: \`foundation/data/quarantine/phase2-replay-output.jsonl\`
- Normalized Output: \`foundation/data/normalized/phase2-normalized-sample.jsonl\`
- Replay Rows: ${replayRecords.length}
- Injected Rows: ${toInject.length}
- Skipped Rows(duplicate id): ${replayRecords.length - toInject.length}
`;
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, markdown, "utf8");

console.log(`replay_rows=${replayRecords.length}`);
console.log(`reinject_rows=${toInject.length}`);
console.log(`reinject_report=foundation/evaluation/metrics/reinject-replay-report.md`);
