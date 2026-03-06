#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DEFAULT_CONTEXT = "foundation/data/specialforce/specialforce-context-sample.json";
const DEFAULT_OUTPUT = "foundation/data/normalized/phase3-specialforce-adapter.jsonl";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toObservationRecord(context, item) {
  return {
    entityType: "Observation",
    organizationId: context.organizationId,
    domainKey: item.domainKey,
    eventTime: item.observedAt,
    quality: {
      confidence: item.confidence ?? 0.5,
      trustScore: item.confidence ?? 0.5,
      piiFlag: false,
    },
    raw: {
      connector: "specialforce_context",
      entityType: "Observation",
      id: item.id,
      organizationId: context.organizationId,
      sourceType: item.sourceType || "session",
      sourceKey: item.sourceKey || context.trainingSession.id,
      observedAt: item.observedAt,
      domainKey: item.domainKey,
      signalType: item.signalType || "event_signal",
      signalValue: item.signalValue || item.sourceKey || "signal",
      confidence: item.confidence ?? 0.5,
      trainingSessionId: context.trainingSession.id,
      aarReportId: context.aarReport.id,
    },
  };
}

function toPredictionRecord(context, item) {
  return {
    entityType: "Prediction",
    organizationId: context.organizationId,
    domainKey: item.domainKey,
    eventTime: item.createdAt,
    quality: {
      confidence: item.confidence ?? 0.5,
      trustScore: item.confidence ?? 0.5,
      piiFlag: false,
    },
    raw: {
      connector: "specialforce_context",
      entityType: "Prediction",
      id: item.id,
      organizationId: context.organizationId,
      runKey: item.runKey || `${item.domainKey}-historical-run`,
      domainKey: item.domainKey,
      horizonValue: 7,
      horizonUnit: "DAY",
      probability: item.probability ?? 0.5,
      modelVersion: "specialforce-context-v1",
      promptHash: "specialforce-context-adapter-v1",
      createdAt: item.createdAt,
      confidence: item.confidence ?? 0.5,
      selectedPolicyRule: item.selectedPolicyRule || "unknown",
      conflictScore: item.conflictScore ?? 0,
      dissentCount: item.dissentCount ?? 0,
      trainingSessionId: context.trainingSession.id,
      aarReportId: context.aarReport.id,
    },
  };
}

const contextPath = path.resolve(ROOT_DIR, process.env.SPECIALFORCE_CONTEXT_INPUT || DEFAULT_CONTEXT);
const outputPath = path.resolve(ROOT_DIR, process.env.SPECIALFORCE_ADAPTER_OUTPUT || DEFAULT_OUTPUT);
const context = readJson(contextPath);
const normalizedRows = [
  ...context.observations.map((item) => toObservationRecord(context, item)),
  ...context.priorPredictions.map((item) => toPredictionRecord(context, item)),
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${normalizedRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

const domainBreakdown = normalizedRows.reduce((acc, row) => {
  acc[row.domainKey] = (acc[row.domainKey] || 0) + 1;
  return acc;
}, {});

console.log(`specialforce_adapter_rows=${normalizedRows.length}`);
console.log(`specialforce_adapter_output=${path.relative(ROOT_DIR, outputPath)}`);
console.log(`specialforce_adapter_domains=${Object.keys(domainBreakdown).join(",")}`);
