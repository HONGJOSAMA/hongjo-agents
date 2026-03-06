#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DEFAULT_INPUT = "foundation/data/normalized/phase2-normalized-sample.jsonl";

function readJsonl(filePath) {
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

function safeAverage(values) {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Number((sum / values.length).toFixed(4));
}

function buildPrediction(rows, config) {
  const confidences = rows
    .map((row) => row.quality?.confidence)
    .filter((value) => typeof value === "number");
  const avgConfidence = safeAverage(confidences) ?? 0.5;

  return {
    id: `${config.domainKey}-prediction-${Date.now()}`,
    organizationId: rows[0]?.organizationId || "org-demo-001",
    domainKey: config.domainKey,
    runKey: `${config.domainKey}-run-${Date.now()}`,
    horizonValue: config.horizonValue,
    horizonUnit: config.horizonUnit,
    probability: Number(Math.min(0.95, Math.max(0.05, avgConfidence)).toFixed(2)),
    confidence: Number(Math.min(0.99, Math.max(0.1, avgConfidence)).toFixed(2)),
    modelVersion: config.modelVersion,
    promptHash: config.promptHash,
    createdAt: new Date().toISOString(),
  };
}

function buildHypothesis(rows, config) {
  const recent = rows[0];
  return {
    id: `${config.domainKey}-hypothesis-${Date.now()}`,
    organizationId: recent?.organizationId || "org-demo-001",
    domainKey: config.domainKey,
    claim: config.claimTemplate,
    assumptions: [
      "normalized observations remain directionally consistent",
      "sample ingestion quality stays above threshold",
      "no contradictory high-trust signal dominates the domain stream",
    ],
    createdAt: new Date().toISOString(),
    confidence: recent?.quality?.confidence ?? 0.5,
    linkedObservationIds: rows.slice(0, 3).map((row) => row.raw?.id).filter(Boolean),
  };
}

function buildEvidence(rows, predictionId) {
  return rows.slice(0, 3).map((row, index) => ({
    id: `${predictionId}-evidence-${index + 1}`,
    organizationId: row.organizationId || "org-demo-001",
    predictionId,
    sourceUrl: `urn:observation:${row.raw?.id || index + 1}`,
    sourceTitle: row.raw?.sourceKey || row.raw?.signalType || "normalized-signal",
    trustScore: typeof row.quality?.trustScore === "number" ? row.quality.trustScore : 0.5,
    freshness: "fresh",
    excerpt: row.raw?.signalValue || row.raw?.sourceType || "signal",
    createdAt: new Date().toISOString(),
  }));
}

function summarizeRows(rows) {
  const byEntityType = {};
  for (const row of rows) {
    const key = row.entityType || "__missing__";
    byEntityType[key] = (byEntityType[key] || 0) + 1;
  }
  return byEntityType;
}

export async function runDomainAgent(config) {
  const inputPath = path.resolve(ROOT_DIR, process.env.DOMAIN_AGENT_INPUT || DEFAULT_INPUT);
  const allRows = readJsonl(inputPath);
  const domainRows = allRows.filter((row) => row.domainKey === config.domainKey);

  if (domainRows.length === 0) {
    throw new Error(`domain_rows_missing:${config.domainKey}`);
  }

  const hypothesis = buildHypothesis(domainRows, config);
  const prediction = buildPrediction(domainRows, config);
  const evidence = buildEvidence(domainRows, prediction.id);

  return {
    agentId: config.agentId,
    domainKey: config.domainKey,
    displayName: config.displayName,
    generatedAt: new Date().toISOString(),
    input: {
      normalizedSource: path.relative(ROOT_DIR, inputPath),
      rowCount: domainRows.length,
      entityTypeBreakdown: summarizeRows(domainRows),
    },
    rules: config.rules,
    hypothesis,
    prediction,
    evidence,
  };
}

export function writeAgentOutput(result) {
  const outputDir = path.resolve(ROOT_DIR, "foundation/evaluation/agents");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.resolve(outputDir, `${result.domainKey}-agent-output.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return path.relative(ROOT_DIR, outputPath);
}
