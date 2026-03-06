#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const INPUT_PATH = path.resolve(ROOT_DIR, "foundation/data/normalized/phase2-normalized-sample.jsonl");
const OUTPUT_PATH = path.resolve(ROOT_DIR, "foundation/data/specialforce/specialforce-context-sample.json");

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const rows = readJsonl(INPUT_PATH);
const observationRows = rows.filter((row) => row.entityType === "Observation");
const predictionRows = rows.filter((row) => row.entityType === "Prediction");
const targetSessionId = "session-01";
const targetAarId = "aar-01";
const organizationId = rows[0]?.organizationId || "org-demo-001";
const domains = [...new Set(rows.map((row) => row.domainKey).filter(Boolean))];

const context = {
  schemaVersion: "specialforce-context/v1",
  contextId: "specialforce-context-sample-001",
  organizationId,
  trainingSession: {
    id: targetSessionId,
    title: "Sample Specialforce Session",
    startedAt: observationRows[0]?.eventTime || new Date().toISOString(),
    status: "completed",
    domainHints: domains,
  },
  aarReport: {
    id: targetAarId,
    status: "submitted",
    summary:
      "Sample AAR summary composed from normalized phase2 data to validate domain-agent context adaptation.",
    createdAt: predictionRows.find((row) => row.raw?.aarReportId === targetAarId)?.eventTime || new Date().toISOString(),
  },
  actionItems: domains.map((domainKey, index) => ({
    id: `action-${String(index + 1).padStart(3, "0")}`,
    organizationId,
    aarReportId: targetAarId,
    domainKey,
    title: `${domainKey} follow-up review`,
    status: "open",
    ownerUserId: `user-${String((index % 3) + 1).padStart(3, "0")}`,
  })),
  observations: observationRows.slice(0, 25).map((row) => ({
    id: row.raw?.id || row.eventTime,
    organizationId: row.organizationId,
    domainKey: row.domainKey,
    sourceType: row.raw?.sourceType,
    sourceKey: row.raw?.sourceKey,
    signalType: row.raw?.signalType,
    signalValue: row.raw?.signalValue,
    observedAt: row.eventTime,
    confidence: row.quality?.confidence ?? 0.5,
  })),
  priorPredictions: predictionRows
    .filter((row) => row.raw?.trainingSessionId === targetSessionId || row.raw?.aarReportId === targetAarId)
    .map((row) => ({
      id: row.raw?.id,
      organizationId: row.organizationId,
      domainKey: row.domainKey,
      runKey: row.raw?.runKey,
      trainingSessionId: row.raw?.trainingSessionId,
      aarReportId: row.raw?.aarReportId,
      probability: row.raw?.probability,
      confidence: row.raw?.confidence,
      selectedPolicyRule: row.raw?.selectedPolicyRule,
      conflictScore: row.raw?.conflictScore,
      dissentCount: row.raw?.dissentCount,
      createdAt: row.eventTime,
    })),
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(context, null, 2)}\n`, "utf8");

console.log(`specialforce_context_sample=${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
