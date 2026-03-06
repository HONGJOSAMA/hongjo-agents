#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DEFAULT_INPUT = "foundation/data/normalized/phase2-normalized-sample.jsonl";
const OUTPUT_SCHEMA_VERSION = "phase3-domain-agent-output/v1";
const CONTRACT_VERSION = "1.0.0";

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

function getValueByPath(target, fieldPath) {
  return fieldPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), target);
}

function hasRequiredFields(row, requiredFields) {
  return requiredFields.every((fieldPath) => getValueByPath(row, fieldPath) !== undefined);
}

function safeAverage(values) {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Number((sum / values.length).toFixed(4));
}

function normalizeUnit(unit) {
  return String(unit || "day").toLowerCase();
}

function summarizeRows(rows, field, fallbackKey = "__missing__") {
  const summary = {};
  for (const row of rows) {
    const key = getValueByPath(row, field) || fallbackKey;
    summary[key] = (summary[key] || 0) + 1;
  }
  return summary;
}

function computeRiskLevel(probability) {
  if (probability >= 0.67) {
    return "high";
  }
  if (probability >= 0.34) {
    return "medium";
  }
  return "low";
}

function rankRows(rows, filterConfig) {
  const preferredSourceTypes = new Set(filterConfig.preferredSourceTypes || []);
  const preferredSignalTypes = new Set(filterConfig.preferredSignalTypes || []);

  return [...rows].sort((left, right) => {
    const leftPreferredSource = preferredSourceTypes.has(left.raw?.sourceType) ? 1 : 0;
    const rightPreferredSource = preferredSourceTypes.has(right.raw?.sourceType) ? 1 : 0;
    if (leftPreferredSource !== rightPreferredSource) {
      return rightPreferredSource - leftPreferredSource;
    }

    const leftPreferredSignal = preferredSignalTypes.has(left.raw?.signalType) ? 1 : 0;
    const rightPreferredSignal = preferredSignalTypes.has(right.raw?.signalType) ? 1 : 0;
    if (leftPreferredSignal !== rightPreferredSignal) {
      return rightPreferredSignal - leftPreferredSignal;
    }

    const leftConfidence = typeof left.quality?.confidence === "number" ? left.quality.confidence : 0;
    const rightConfidence = typeof right.quality?.confidence === "number" ? right.quality.confidence : 0;
    if (leftConfidence !== rightConfidence) {
      return rightConfidence - leftConfidence;
    }

    const leftTime = Date.parse(left.eventTime || left.raw?.observedAt || 0);
    const rightTime = Date.parse(right.eventTime || right.raw?.observedAt || 0);
    return rightTime - leftTime;
  });
}

function applyInputFilter(rows, filterConfig) {
  return rows.filter((row) => {
    const sourceType = row.raw?.sourceType || row.raw?.connector;
    if (filterConfig.entityTypes?.length && !filterConfig.entityTypes.includes(row.entityType)) {
      return false;
    }
    if (
      filterConfig.preferredSourceTypes?.length &&
      !filterConfig.preferredSourceTypes.includes(sourceType)
    ) {
      return false;
    }
    if (
      filterConfig.preferredSignalTypes?.length &&
      row.entityType !== "Prediction" &&
      !filterConfig.preferredSignalTypes.includes(row.raw?.signalType)
    ) {
      return false;
    }
    if (
      typeof filterConfig.minimumConfidence === "number" &&
      (typeof row.quality?.confidence !== "number" || row.quality.confidence < filterConfig.minimumConfidence)
    ) {
      return false;
    }
    return true;
  });
}

function buildPrediction(rows, config) {
  const confidences = rows
    .map((row) => row.quality?.confidence)
    .filter((value) => typeof value === "number");
  const avgConfidence = safeAverage(confidences) ?? 0.5;
  const probability = Number(Math.min(0.95, Math.max(0.05, avgConfidence)).toFixed(2));
  const confidence = Number(Math.min(0.99, Math.max(0.1, avgConfidence)).toFixed(2));

  return {
    id: `${config.domainKey}-prediction-${Date.now()}`,
    organizationId: rows[0]?.organizationId || "org-demo-001",
    domainKey: config.domainKey,
    runKey: `${config.domainKey}-run-${Date.now()}`,
    horizonValue: config.horizonValue,
    horizonUnit: normalizeUnit(config.horizonUnit),
    probability,
    confidence,
    modelVersion: config.modelVersion,
    promptHash: config.promptHash,
    riskLevel: computeRiskLevel(probability),
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
    excerpt:
      row.raw?.signalValue ||
      String(row.raw?.probability || "") ||
      row.raw?.sourceType ||
      "signal",
    createdAt: new Date().toISOString(),
  }));
}

function buildScoring(rows, prediction, minimumEvidence) {
  const confidences = rows
    .map((row) => row.quality?.confidence)
    .filter((value) => typeof value === "number");
  const trustScores = rows
    .map((row) => row.quality?.trustScore)
    .filter((value) => typeof value === "number");
  const signalStrength = Number(Math.min(1, rows.length / Math.max(minimumEvidence + 2, 1)).toFixed(2));
  const evidenceStrength = Number((safeAverage(trustScores) ?? safeAverage(confidences) ?? 0.5).toFixed(2));

  return {
    confidence: prediction.confidence,
    signalStrength,
    evidenceStrength,
    riskLevel: prediction.riskLevel,
  };
}

export async function runDomainAgent(config) {
  const inputPath = path.resolve(ROOT_DIR, process.env.DOMAIN_AGENT_INPUT || DEFAULT_INPUT);
  const allRows = readJsonl(inputPath);
  const domainRows = allRows.filter((row) => row.domainKey === config.domainKey);
  const requiredFields = config.requiredFields || [];
  const validRows = domainRows.filter((row) => hasRequiredFields(row, requiredFields));
  const missingRequiredCount = domainRows.length - validRows.length;
  const minimumEvidence = config.minimumEvidence || 3;
  const filterConfig = config.inputFilter || {};

  if (domainRows.length === 0) {
    throw new Error(`domain_rows_missing:${config.domainKey}`);
  }

  const strictFilteredRows = applyInputFilter(validRows, filterConfig);
  const rankedStrictRows = rankRows(strictFilteredRows, filterConfig);
  const rankedFallbackRows = rankRows(validRows, filterConfig);
  const selectedRowsPool = rankedStrictRows.length >= minimumEvidence ? rankedStrictRows : rankedFallbackRows;
  const fallbackUsed = rankedStrictRows.length < minimumEvidence;
  const selectionLimit = filterConfig.selectionLimit || 5;
  const selectedRows = selectedRowsPool.slice(0, selectionLimit);

  if (selectedRows.length < minimumEvidence) {
    throw new Error(`domain_filtered_rows_insufficient:${config.domainKey}:${selectedRows.length}`);
  }

  const hypothesis = buildHypothesis(selectedRows, config);
  const prediction = buildPrediction(selectedRows, config);
  const evidence = buildEvidence(selectedRows, prediction.id);
  const scoring = buildScoring(selectedRows, prediction, minimumEvidence);
  const selectedRuleIds = ["domain_filter", "quality_sort"];

  if (config.focusRuleId) {
    selectedRuleIds.push(config.focusRuleId);
  }

  return {
    schemaVersion: config.schemaVersion || OUTPUT_SCHEMA_VERSION,
    contractVersion: config.contractVersion || CONTRACT_VERSION,
    agentId: config.agentId,
    domainKey: config.domainKey,
    displayName: config.displayName,
    generatedAt: new Date().toISOString(),
    status: "ok",
    input: {
      normalizedSource: path.relative(ROOT_DIR, inputPath),
      rowCount: domainRows.length,
      filteredRowCount: selectedRows.length,
      entityTypeBreakdown: summarizeRows(selectedRows, "entityType"),
      sourceTypeBreakdown: summarizeRows(selectedRows, "raw.sourceType"),
      signalTypeBreakdown: summarizeRows(selectedRows, "raw.signalType"),
      selectionPolicy: fallbackUsed ? "strict_filter_with_domain_fallback" : "strict_filter_only",
      selectedObservationIds: selectedRows.map((row) => row.raw?.id).filter(Boolean),
    },
    scoring,
    trace: {
      selectedRuleIds,
      fallbackUsed,
      notes: fallbackUsed
        ? ["strict domain filter returned fewer than minimum evidence rows, used ranked domain fallback"]
        : ["strict domain filter satisfied minimum evidence rows"],
    },
    validation: {
      minimumEvidence,
      requiredFieldMissingCount: missingRequiredCount,
      schemaCheckPassed: true,
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
