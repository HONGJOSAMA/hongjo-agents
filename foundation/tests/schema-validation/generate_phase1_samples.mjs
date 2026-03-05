#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const domains = [
  "macroeconomy",
  "policy_politics",
  "geopolitics_security",
  "supply_chain_trade",
  "cyber_information",
];

const organizationId = "org-demo-001";
const baseObservedAt = "2026-03-06T00:00:00Z";

function isoMinuteOffset(minutes) {
  const base = new Date(baseObservedAt).getTime();
  return new Date(base + minutes * 60_000).toISOString();
}

function pickDomain(index) {
  return domains[index % domains.length];
}

function buildRecords() {
  const records = [];

  for (let i = 0; i < 25; i += 1) {
    records.push({
      entityType: "Observation",
      id: `obs-${String(i + 1).padStart(3, "0")}`,
      organizationId,
      sourceType: i % 2 === 0 ? "api" : "document",
      sourceKey: `source-${(i % 5) + 1}`,
      observedAt: isoMinuteOffset(i),
      domainKey: pickDomain(i),
      signalType: i % 2 === 0 ? "rate_signal" : "event_signal",
      signalValue: `signal-${i + 1}`,
      confidence: 0.72,
      tags: ["phase1", "sample"],
      piiFlag: false,
      lineageId: `lineage-obs-${String(i + 1).padStart(3, "0")}`,
      ingestionRunId: `ingest-${String((i % 4) + 1).padStart(2, "0")}`,
    });
  }

  for (let i = 0; i < 20; i += 1) {
    records.push({
      entityType: "Hypothesis",
      id: `hyp-${String(i + 1).padStart(3, "0")}`,
      organizationId,
      domainKey: pickDomain(i),
      claim: `Hypothesis claim ${i + 1}`,
      assumptions: [`assumption-${(i % 3) + 1}`],
      createdAt: isoMinuteOffset(100 + i),
      counterfactual: `Counterfactual ${i + 1}`,
      confidence: 0.7,
      linkedObservationIds: [
        `obs-${String((i % 25) + 1).padStart(3, "0")}`,
        `obs-${String(((i + 7) % 25) + 1).padStart(3, "0")}`,
      ],
    });
  }

  for (let i = 0; i < 20; i += 1) {
    records.push({
      entityType: "Prediction",
      id: `pred-${String(i + 1).padStart(3, "0")}`,
      organizationId,
      runKey: `run-${String(i + 1).padStart(3, "0")}`,
      domainKey: pickDomain(i),
      horizonValue: 7,
      horizonUnit: "DAY",
      probability: Number((0.35 + (i % 4) * 0.1).toFixed(2)),
      modelVersion: "v1.0.0",
      promptHash: `hash-${String(i + 1).padStart(3, "0")}`,
      createdAt: isoMinuteOffset(200 + i),
      confidence: 0.74,
      selectedPolicyRule: "minimax_regret",
      conflictScore: 0.23,
      dissentCount: 1,
      inferenceCostUsd: 0.03,
      inferenceLatencyMs: 1200,
      trainingSessionId: `session-${String((i % 3) + 1).padStart(2, "0")}`,
      aarReportId: `aar-${String((i % 2) + 1).padStart(2, "0")}`,
    });
  }

  for (let i = 0; i < 20; i += 1) {
    records.push({
      entityType: "Evidence",
      id: `evd-${String(i + 1).padStart(3, "0")}`,
      organizationId,
      predictionId: `pred-${String(i + 1).padStart(3, "0")}`,
      sourceUrl: `https://example.org/evidence/${i + 1}`,
      trustScore: 0.81,
      freshness: "DAILY",
      createdAt: isoMinuteOffset(300 + i),
      sourceTitle: `Evidence ${i + 1}`,
      excerpt: `Evidence excerpt ${i + 1}`,
      sourceType: "news",
    });
  }

  for (let i = 0; i < 10; i += 1) {
    records.push({
      entityType: "Dissent",
      id: `dis-${String(i + 1).padStart(3, "0")}`,
      organizationId,
      predictionId: `pred-${String(i + 1).padStart(3, "0")}`,
      domainKey: pickDomain(i),
      dissentReason: `Dissent reason ${i + 1}`,
      alternative: `Alternative scenario ${i + 1}`,
      createdAt: isoMinuteOffset(400 + i),
      dissentScore: 0.45,
    });
  }

  for (let i = 0; i < 5; i += 1) {
    records.push({
      entityType: "Outcome",
      id: `out-${String(i + 1).padStart(3, "0")}`,
      organizationId,
      predictionId: `pred-${String(i + 1).padStart(3, "0")}`,
      outcomeLabel: i % 2 === 0 ? "HIT" : "PARTIAL",
      observedResult: `observed-result-${i + 1}`,
      observedAt: isoMinuteOffset(500 + i),
      impactScore: 0.6,
      severityText: "medium",
    });
  }

  return records;
}

const outputPath = path.resolve(
  process.cwd(),
  "foundation/tests/schema-validation/phase1-sample-100.jsonl",
);

const records = buildRecords();
const body = `${records.map((row) => JSON.stringify(row)).join("\n")}\n`;
fs.writeFileSync(outputPath, body, "utf8");

console.log(`generated=${records.length}`);
console.log(`output=${outputPath}`);
